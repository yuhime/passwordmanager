use serde_valid::validation;
use tokio::sync::RwLock;

pub fn validate_salt(salt: &String) -> Result<(), validation::Error> {
    if salt.len() < 16 {
        return Err(validation::Error::Custom("invalid salt".to_string()));
    }
    Ok(())
}

pub fn validate_nonce(nonce: &String) -> Result<(), validation::Error> {
    if nonce.len() < 12 {
        return Err(validation::Error::Custom("invalid nonce".to_string()));
    }
    Ok(())
}

pub fn default_use_times() -> RwLock<usize> {
    RwLock::new(0)
}
