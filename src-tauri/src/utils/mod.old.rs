use std::collections::HashMap;
use std::{fs, path::Path};

use aead::{AeadMut, KeyInit};
use aes_gcm_siv::{Aes256GcmSiv, AesGcmSiv, Key, Nonce};
use argon2::PasswordHasher;
use argon2::{password_hash::SaltString, Argon2};
use base64::{prelude::BASE64_STANDARD, Engine};
use rand::{rngs::OsRng, TryRngCore};
use zeroize::Zeroizing;

use crate::types::Vault;
use crate::{
    error::{Error, Result},
    types::EncVault,
};

pub fn save_password(
    master_password: &str,
    new_label: &str,
    new_value: &str,
    path: &str,
) -> Result<()> {
    let enc = if Path::new(path).exists() {
        let file_data = fs::read_to_string(path)?;
        Some(serde_json::from_str::<EncVault>(&file_data)?)
    } else {
        None
    };

    let (salt, key): (Vec<u8>, Key<Aes256GcmSiv>) = {
        let salt = if let Some(ref e) = enc {
            BASE64_STANDARD.decode(&e.salt)?
        } else {
            let mut salt = [0u8; 16];
            OsRng.try_fill_bytes(&mut salt)?;
            salt.to_vec()
        };

        let argon2 = Argon2::default();
        let key_bytes = {
            let mut out = [0u8; 32];
            argon2
                .hash_password_into(master_password.as_bytes(), &salt, &mut out)
                .map_err(|e| Error::Argon2(e.into()))?;
            out
        };

        (salt, Key::<Aes256GcmSiv>::from_slice(&key_bytes).to_owned())
    };

    let mut vault = if let Some(ref e) = enc {
        let nonce = &BASE64_STANDARD.decode(&e.nonce)?;
        let nonce = Nonce::from_slice(nonce);
        let mut cipher = Aes256GcmSiv::new(&key);
        let dec = cipher
            .decrypt(nonce, BASE64_STANDARD.decode(&e.ciphertext)?.as_ref())
            .unwrap();
        serde_json::from_slice::<Vault>(&dec)?
    } else {
        Vault {
            passwords: HashMap::new(),
        }
    };

    vault
        .passwords
        .insert(new_label.to_string(), new_value.to_string().into());
    let serialzed = serde_json::to_vec(&vault)?;
    let mut nonce_bytes = [0u8; 12];
    OsRng.try_fill_bytes(&mut nonce_bytes)?;
    let nonce = Nonce::from_slice(&nonce_bytes);

    let mut cipher = Aes256GcmSiv::new(&key);
    let ciphertext = cipher.encrypt(nonce, serialzed.as_ref()).unwrap();

    let enc_vault = EncVault {
        salt: BASE64_STANDARD.encode(&salt),
        nonce: BASE64_STANDARD.encode(&nonce),
        ciphertext: BASE64_STANDARD.encode(&ciphertext),
    };

    let json = serde_json::to_string_pretty(&enc_vault)?;
    fs::write(path, json)?;

    vault.zeroize();

    Ok(())
}

pub fn get_password(master_password: Zeroizing<String>, path: &str, label: &str) -> Result<String> {
    let file_content = fs::read_to_string(path)?;
    let encrypted: EncVault = serde_json::from_str(&file_content)?;

    let salt = BASE64_STANDARD.decode(&encrypted.salt)?;
    let nonce_bytes = BASE64_STANDARD.decode(&encrypted.nonce)?;
    let nonce = Nonce::from_slice(&nonce_bytes);

    // 3. Deriva la chiave con Argon2
    let argon2 = Argon2::default();
    let key_bytes = {
        let mut out = [0u8; 32];
        argon2
            .hash_password_into(master_password.as_bytes(), &salt, &mut out)
            .unwrap();
        out
    };

    let key = Key::<Aes256GcmSiv>::from_slice(&key_bytes);

    let mut cipher = Aes256GcmSiv::new(key);
    let decrypted = match cipher.decrypt(
        nonce,
        BASE64_STANDARD.decode(&encrypted.ciphertext)?.as_ref(),
    ) {
        Ok(decrypted) => decrypted,
        Err(_) => return Err(Error::VaultDecrypt),
    };

    let mut vault: Vault = serde_json::from_slice(&decrypted)?;

    vault.zeroize();
    Ok(vault.passwords.keys().cloned().collect())
}
