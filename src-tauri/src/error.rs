pub type Result<T> = std::result::Result<T, self::Error>;

pub trait ToStringErr<T> {
    fn to_string_err(self) -> std::result::Result<T, String>;
}

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error(transparent)]
    Json(#[from] serde_json::Error),
    #[error(transparent)]
    Base64(#[from] base64::DecodeError),
    #[error(transparent)]
    OsRng(#[from] rand::rand_core::OsError),
    #[error("{0}")]
    Argon2(argon2::password_hash::Error),
    #[error("{0}")]
    Crypto(aes_gcm_siv::Error),
    #[error(transparent)]
    Tauri(#[from] tauri::Error),
    #[error("Vault decryption failed")]
    VaultDecrypt,
    #[error("{0}")]
    Custom(String),
}

impl<T, E: ToString> ToStringErr<T> for std::result::Result<T, E> {
    fn to_string_err(self) -> std::result::Result<T, String> {
        self.map_err(|e| e.to_string())
    }
}
