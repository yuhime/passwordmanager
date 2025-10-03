use std::ops::Deref;

use tokio::sync::RwLock;
use zeroize::Zeroizing;

use crate::{error::Error, types::Vault};

pub struct AppState {
    vault: RwLock<Vault>,
}

// impl AppState {
//     pub async fn get_passwords(&self) -> Vec<String> {
//         self.vault.read()
//     }
// }
