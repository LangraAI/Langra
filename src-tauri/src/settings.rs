use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub style: String,
}

impl Default for Settings {
    fn default() -> Self {
        Settings {
            style: "friendly".to_string(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiKeySettings {
    pub provider: String,
    pub openai_api_key: String,
    pub azure_endpoint: String,
    pub azure_api_key: String,
    pub azure_deployment: String,
}

static SETTINGS: Mutex<Option<Settings>> = Mutex::new(None);

fn get_settings_path() -> PathBuf {
    let mut path = dirs::config_dir().unwrap_or_else(|| PathBuf::from("."));
    path.push("langra");
    fs::create_dir_all(&path).ok();
    path.push("settings.json");
    println!("[SETTINGS] Settings path: {:?}", path);
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
pub async fn save_settings(settings: Settings) -> Result<(), String> {
    save_settings_to_disk(&settings)?;
    Ok(())
}

#[tauri::command]
pub async fn save_api_keys(api_settings: ApiKeySettings) -> Result<(), String> {
    let token = crate::get_access_token()
        .map_err(|_| "You must be logged in to save API keys".to_string())?;

    println!("[SETTINGS] Sending API credentials to backend");

    let client = reqwest::Client::new();

    let json_body = if api_settings.provider == "azure" {
        serde_json::json!({
            "azure_endpoint": api_settings.azure_endpoint,
            "azure_api_key": api_settings.azure_api_key,
            "azure_deployment": api_settings.azure_deployment,
        })
    } else {
        serde_json::json!({
            "openai_api_key": api_settings.openai_api_key,
        })
    };

    let response = client
        .post("http://localhost:3000/api/credentials")
        .header("Authorization", format!("Bearer {}", token))
        .json(&json_body)
        .send()
        .await
        .map_err(|e| format!("Failed to connect to backend: {}", e))?;

    if response.status().is_success() {
        println!("[SETTINGS] ✅ API keys saved to backend");
        Ok(())
    } else {
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        Err(format!("Failed to save API keys: {}", error_text))
    }
}

