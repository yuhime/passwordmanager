pub mod commands;
pub mod error;
pub mod state;
pub mod types;
pub mod utils;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // save_password("ciao123", "gmail", "password123", "./vault.bin");
    // save_password("ciao123", "gmail2", "spassword123", "./vault.bin");
    // save_password("ciao123", "gmail3", "spassword123", "./vault.bin");
    // save_password("ciao123", "gmail4", "spassword123", "./vault.bin");
    // save_password("ciao123", "gmail5", "spassword123", "./vault.bin");
    // save_password("ciao123", "gmail6", "sddpassword123", "./vault.bin");

    // let passwords = list_passwords("ciao123".to_string().into(), "./vault.bin").unwrap();
    // println!("Passwords: {:?}", passwords);

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::decrypt,
            commands::need_initialization,
            commands::initialize,
            commands::is_decrypted,
            commands::passwords::list_passwords,
            commands::passwords::expose_password,
            commands::passwords::save_passwords,
            commands::passwords::insert_password
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
