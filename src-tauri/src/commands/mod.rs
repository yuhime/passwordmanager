pub mod passwords;

use secrecy::ExposeSecret;
use serde_valid::Validate;
use tauri::{AppHandle, Manager, WebviewWindowBuilder};
use zeroize::Zeroizing;

use crate::{
    error::ToStringErr,
    types::{EncVault, Vault},
};

#[tauri::command]
pub async fn is_decrypted(app: AppHandle) -> Result<bool, String> {
    Ok(app.try_state::<Vault>().is_some())
}

#[tauri::command]
pub async fn decrypt(app: AppHandle, password: String) -> Result<(), String> {
    let path = app
        .path()
        .app_local_data_dir()
        .to_string_err()?
        .join("vault.json");

    if !path.exists() {
        return Err("Vault not initialized".to_string());
    }

    let file_data = std::fs::read_to_string(&path).to_string_err()?;
    let encrypted_vault: EncVault = serde_json::from_str(&file_data).to_string_err()?;

    let vault = encrypted_vault
        .decrypt(Zeroizing::new(password), path)
        .await
        .to_string_err()?;

    app.manage(vault);

    Ok(())
}

#[tauri::command]
pub fn need_initialization(app: AppHandle) -> Result<bool, String> {
    let path = app
        .path()
        .app_local_data_dir()
        .to_string_err()?
        .join("vault.json");

    if !path.exists() {
        return Ok(true);
    }

    let file_data = std::fs::read_to_string(&path).to_string_err()?;
    let _: EncVault = serde_json::from_str(&file_data).to_string_err()?;

    Ok(false)
}

#[tauri::command()]
pub async fn initialize(app: AppHandle, master_password: Zeroizing<String>) -> Result<(), String> {
    let path = app
        .path()
        .app_local_data_dir()
        .to_string_err()?
        .join("vault.json");

    if path.exists() {
        return Err("Vault already initialized".to_string());
    }

    if master_password.is_empty() {
        return Err("Master password cannot be empty".to_string());
    }

    let encrypted_vault = EncVault::init(master_password.clone(), path.clone()).to_string_err()?;
    let vault = encrypted_vault
        .decrypt(master_password, path)
        .await
        .to_string_err()?;

    app.manage(vault);

    Ok(())
}
