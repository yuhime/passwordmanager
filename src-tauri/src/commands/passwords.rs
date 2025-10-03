use std::collections::HashMap;

use tauri::{AppHandle, Manager};
use uuid::Uuid;
use zeroize::Zeroizing;

use crate::{
    error::ToStringErr,
    types::{PasswordData, PasswordFragment, Vault},
};

#[tauri::command]
pub async fn list_passwords(app: AppHandle) -> Result<Vec<PasswordFragment>, String> {
    let vault = app.state::<Vault>();

    Ok(vault.list_passwords())
}

#[tauri::command]
pub async fn expose_password(app: AppHandle, key: Uuid) -> Result<String, String> {
    let vault = app.state::<Vault>();

    Ok(vault.expose_password(&key).to_string_err()?)
}

#[tauri::command]
pub async fn insert_password(app: AppHandle, value: PasswordData) -> Result<(), String> {
    let vault = app.state::<Vault>();

    Ok(vault.insert(value))
}

#[tauri::command]
pub async fn save_passwords(app: AppHandle) -> Result<(), String> {
    let vault = app.state::<Vault>();
    vault.save().await.to_string_err()?;

    Ok(())
}
