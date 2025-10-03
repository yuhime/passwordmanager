use std::{
    collections::HashMap, fs, ops::Deref, path::PathBuf, str::FromStr, sync::atomic::AtomicBool,
};

use aead::{AeadMut, Key, KeyInit};
use aes_gcm_siv::{Aes256GcmSiv, Nonce};
use argon2::Argon2;
use base64::{prelude::BASE64_STANDARD, Engine};
use dashmap::DashMap;
use rand::{rngs::OsRng, TryRngCore};
use secrecy::{ExposeSecret, SecretBox};
use serde::{Deserialize, Serialize};
use serde_valid::Validate;
use sha2::{Digest, Sha256};
use tokio::sync::{Mutex, RwLock, RwLockReadGuard};
use uuid::Uuid;
use zeroize::{Zeroize, Zeroizing};

use crate::error::{Error, Result, ToStringErr};

#[derive(Serialize)]
pub struct PasswordFragment {
    id: Uuid,
    label: String,
    use_count: usize,
}

impl PasswordFragment {
    pub fn new(id: Uuid, label: String, use_times: usize) -> Self {
        Self {
            id,
            label,
            use_count: use_times,
        }
    }
}

#[derive(Serialize, Deserialize, Validate)]
pub struct EncVault {
    #[validate(custom = crate::utils::validate_salt)]
    pub salt: String,
    #[validate(custom = crate::utils::validate_nonce)]
    pub nonce: String,
    pub ciphertext: String,
}

#[derive(Serialize, Deserialize, Default)]
pub struct PasswordData {
    label: String,
    username: String,
    email: Zeroizing<String>,
    secret: Zeroizing<String>,
    #[serde(default)]
    hash: Option<String>,
    #[serde(default)]
    use_times: usize,
}

impl PasswordData {
    pub fn new(label: String, username: String, email: String, secret: String) -> Self {
        Self {
            label,
            username,
            email: Zeroizing::new(email),
            secret: Zeroizing::new(secret),
            ..Default::default()
        }
    }

    pub fn hash(&self) -> &String {
        self.hash
            .as_ref()
            .expect("the hash should exist in this context!")
    }

    pub fn try_hash(&self) -> Option<&String> {
        self.hash.as_ref()
    }

    pub fn set_use_times(&mut self, times: usize) {
        self.use_times = times;
    }

    pub fn set_hash(&mut self, hash: String) {
        self.hash = Some(hash);
    }
}

#[derive(Serialize, Deserialize, Default)]
pub struct Vault {
    pub passwords: DashMap<Uuid, PasswordData>,
    #[serde(skip, default)]
    pub master_password: RwLock<Option<SecretBox<String>>>,
    #[serde(skip, default)]
    nonce: RwLock<Option<Nonce>>,
    #[serde(skip, default)]
    salt: RwLock<Option<Vec<u8>>>,
    #[serde(skip, default)]
    path: RwLock<Option<PathBuf>>,
}

impl Vault {
    pub fn zeroize(&mut self) {
        self.passwords.clear();
    }

    pub fn insert(&self, mut value: PasswordData) {
        let pwd_hash = hex::encode(Sha256::digest(value.secret.as_bytes()));
        value.set_hash(pwd_hash.clone());

        let use_times = self
            .passwords
            .iter()
            .filter(|entry| entry.value().hash() == &pwd_hash)
            .count()
            + 1;

        self.passwords
            .iter_mut()
            .filter(|entry| entry.value().hash() == &pwd_hash)
            .for_each(|mut entry| {
                entry.value_mut().use_times = use_times;
            });

        value.set_use_times(use_times);

        let uid = Uuid::new_v4();
        self.passwords.insert(uid, value);
    }

    pub async fn insert_and_save(&self, value: PasswordData) -> Result<()> {
        self.insert(value);
        self.update_and_encrypt(self.path().await?).await?;

        Ok(())
    }

    pub async fn save(&self) -> Result<()> {
        self.update_and_encrypt(self.path().await?).await?;
        Ok(())
    }

    pub fn list_passwords(&self) -> Vec<PasswordFragment> {
        self.passwords
            .iter()
            .map(|entry| {
                let key = entry.key().clone();
                let password = entry.value().clone();
                PasswordFragment::new(key, password.label.clone(), password.use_times)
            })
            .collect()
    }

    pub fn expose_password(&self, key: &Uuid) -> Result<String> {
        match self.passwords.get(key) {
            Some(password) => Ok(password.secret.deref().clone()),
            None => Err(crate::error::Error::Custom(
                "password not found".to_string(),
            )),
        }
    }

    pub async fn path(&self) -> Result<PathBuf> {
        let path = self.path.read().await;

        if path.is_none() {
            return Err(crate::error::Error::Custom("path is not set".to_string()));
        }

        Ok(PathBuf::from(path.as_ref().unwrap()))
    }

    pub async fn salt(&self) -> Result<RwLockReadGuard<'_, Vec<u8>>> {
        let guard = self.salt.read().await;

        if guard.is_none() {
            return Err(crate::error::Error::Custom("salt is not set".to_string()));
        }

        Ok(RwLockReadGuard::map(guard, |opt| opt.as_ref().unwrap()))
    }

    pub async fn nonce(&self) -> Result<RwLockReadGuard<'_, Nonce>> {
        let guard = self.nonce.read().await;

        if guard.is_none() {
            return Err(crate::error::Error::Custom("salt is not set".to_string()));
        }

        Ok(RwLockReadGuard::map(guard, |opt| opt.as_ref().unwrap()))
    }

    pub async fn master_password(&self) -> Result<RwLockReadGuard<'_, SecretBox<String>>> {
        let guard = self.master_password.read().await;

        if guard.is_none() {
            return Err(crate::error::Error::Custom(
                "master password is not set".to_string(),
            ));
        }

        Ok(RwLockReadGuard::map(guard, |opt| opt.as_ref().unwrap()))
    }

    pub async fn update_and_encrypt(&self, path: PathBuf) -> crate::error::Result<()> {
        let serialized = serde_json::to_vec(&self)?;
        let mut nonce_bytes = [0u8; 12];
        OsRng.try_fill_bytes(&mut nonce_bytes)?;
        let nonce = Nonce::from_slice(&nonce_bytes);
        let argon2 = Argon2::default();
        let key_bytes = {
            let mut out = [0u8; 32];
            argon2
                .hash_password_into(
                    self.master_password().await?.expose_secret().as_bytes(),
                    &self.salt().await?,
                    &mut out,
                )
                .map_err(|e| Error::Argon2(e.into()))?;
            out
        };
        let key = Key::<Aes256GcmSiv>::from_slice(&key_bytes).to_owned();

        let mut cipher = Aes256GcmSiv::new(&key);
        let ciphertext = cipher
            .encrypt(nonce, serialized.as_ref())
            .map_err(|e| Error::Custom(e.to_string()))?;

        let encrypt_vault = EncVault {
            salt: BASE64_STANDARD.encode(self.salt().await?.clone()),
            ciphertext: BASE64_STANDARD.encode(ciphertext),
            nonce: BASE64_STANDARD.encode(nonce),
        };

        let json = serde_json::to_string_pretty(&encrypt_vault)?;
        fs::write(path.clone(), json)?;

        Ok(())
    }

    pub async fn set_vault_data(
        &self,
        master_password: Zeroizing<String>,
        salt: Vec<u8>,
        nonce: Nonce,
        path: PathBuf,
    ) -> crate::error::Result<()> {
        if self.master_password.read().await.is_some() {
            return Err(crate::error::Error::Custom(
                "master password is already set".to_string(),
            ));
        }

        let mut reference = self.master_password.write().await;
        *reference = Some(SecretBox::new(Box::new(master_password.deref().clone())));
        let mut salt_reference = self.salt.write().await;
        *salt_reference = Some(salt);
        let mut nonce_reference = self.nonce.write().await;
        *nonce_reference = Some(nonce);
        let mut path_reference = self.path.write().await;
        *path_reference = Some(path);

        Ok(())
    }
}

impl Drop for Vault {
    fn drop(&mut self) {
        self.zeroize();
    }
}

impl EncVault {
    pub async fn decrypt(
        &self,
        master_password: Zeroizing<String>,
        path: PathBuf,
    ) -> crate::error::Result<Vault> {
        let salt = BASE64_STANDARD.decode(&self.salt)?;
        let nonce_bytes = BASE64_STANDARD.decode(&self.nonce)?;
        let nonce = Nonce::from_slice(&nonce_bytes);

        let argon2 = Argon2::default();
        let key_bytes = {
            let mut out = [0u8; 32];
            argon2
                .hash_password_into(master_password.as_bytes(), &salt, &mut out)
                .unwrap();
            SecretBox::new(Box::new(out))
        };

        let key = Key::<Aes256GcmSiv>::from_slice(key_bytes.expose_secret());
        let mut cipher = Aes256GcmSiv::new(key);
        let decrypted_data =
            match cipher.decrypt(nonce, BASE64_STANDARD.decode(&self.ciphertext)?.as_ref()) {
                Ok(data) => data,
                Err(_) => return Err(Error::VaultDecrypt),
            };

        let vault: Vault = serde_json::from_slice(&decrypted_data)?;
        vault
            .set_vault_data(master_password, salt, nonce.clone(), path)
            .await?;

        Ok(vault)
    }

    pub fn init(
        master_password: Zeroizing<String>,
        path: PathBuf,
    ) -> crate::error::Result<EncVault> {
        let (salt, mut key): (Vec<u8>, Key<Aes256GcmSiv>) = {
            let salt = {
                let mut salt = [0u8; 16];
                OsRng.try_fill_bytes(&mut salt)?;
                salt.to_vec()
            };

            let argon2 = Argon2::default();
            let key_bytes = {
                let mut out = [0u8; 32];
                argon2
                    .hash_password_into(master_password.as_bytes(), &salt, &mut out)
                    .unwrap();
                SecretBox::new(Box::new(out))
            };
            let key = Key::<Aes256GcmSiv>::from_slice(key_bytes.expose_secret());

            (salt, key.to_owned())
        };

        let vault = Vault::default();

        let serialized = serde_json::to_vec(&vault)?;
        let mut nonce_bytes = [0u8; 12];
        OsRng.try_fill_bytes(&mut nonce_bytes)?;
        let nonce = Nonce::from_slice(&nonce_bytes);

        let mut cipher = Aes256GcmSiv::new(&key);
        let ciphertext = cipher
            .encrypt(nonce, serialized.as_ref())
            .map_err(|e| Error::Custom(e.to_string()))?;

        key.zeroize();
        let encrypted_vault = Self {
            salt: BASE64_STANDARD.encode(&salt),
            nonce: BASE64_STANDARD.encode(&nonce),
            ciphertext: BASE64_STANDARD.encode(&ciphertext),
        };

        let json = serde_json::to_string_pretty(&encrypted_vault)?;
        fs::write(path, json)?;

        Ok(encrypted_vault)
    }
}
