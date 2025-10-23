use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub provider: String,
    pub openai_api_key: String,
    pub azure_endpoint: String,
    pub azure_api_key: String,
    pub azure_deployment: String,
}

impl Default for Settings {
    fn default() -> Self {
        Settings {
            provider: "azure".to_string(),
            openai_api_key: String::new(),
            azure_endpoint: String::new(),
            azure_api_key: String::new(),
            azure_deployment: "gpt-4o-mini".to_string(),
        }
    }
}

static SETTINGS: Mutex<Option<Settings>> = Mutex::new(None);

fn get_settings_path() -> PathBuf {
    let mut path = dirs::config_dir().unwrap_or_else(|| PathBuf::from("."));
    path.push("Langra");
    fs::create_dir_all(&path).ok();
    path.push("settings.json");
    path
}

pub fn load_settings() -> Settings {
    let mut settings_lock = SETTINGS.lock();

    if let Some(cached_settings) = settings_lock.as_ref() {
        return cached_settings.clone();
    }

    let path = get_settings_path();

    let settings = if path.exists() {
        match fs::read_to_string(&path) {
            Ok(content) => {
                serde_json::from_str(&content).unwrap_or_else(|e| {
                    println!("[SETTINGS] Failed to parse settings: {:?}", e);
                    Settings::default()
                })
            }
            Err(e) => {
                println!("[SETTINGS] Failed to read settings file: {:?}", e);
                Settings::default()
            }
        }
    } else {
        println!("[SETTINGS] No settings file found, using defaults");
        Settings::default()
    };

    *settings_lock = Some(settings.clone());
    settings
}

pub fn save_settings_to_disk(settings: &Settings) -> Result<(), String> {
    let path = get_settings_path();

    let json = serde_json::to_string_pretty(settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;

    fs::write(&path, json)
        .map_err(|e| format!("Failed to write settings: {}", e))?;

    let mut settings_lock = SETTINGS.lock();
    *settings_lock = Some(settings.clone());

    println!("[SETTINGS] Settings saved successfully");
    Ok(())
}

#[tauri::command]
pub fn get_settings() -> Settings {
    load_settings()
}

#[tauri::command]
pub fn save_settings(settings: Settings) -> Result<(), String> {
    save_settings_to_disk(&settings)
}
