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
    pub style: String,
}

impl Default for Settings {
    fn default() -> Self {
        Settings {
            provider: "azure".to_string(),
            openai_api_key: String::new(),
            azure_endpoint: String::new(),
            azure_api_key: String::new(),
            azure_deployment: "gpt-4o-mini".to_string(),
            style: "friendly".to_string(),
        }
    }
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
pub fn save_settings(settings: Settings) -> Result<(), String> {
    save_settings_to_disk(&settings)
}

#[tauri::command]
pub async fn test_api_credentials(settings: Settings) -> Result<String, String> {
    println!("[SETTINGS] Testing API credentials...");

    let client = reqwest::Client::new();

    if settings.provider == "azure" {
        if settings.azure_endpoint.is_empty() {
            return Err("Error: Azure endpoint is empty. Please enter your endpoint URL.".to_string());
        }
        if settings.azure_api_key.is_empty() {
            return Err("Error: Azure API key is empty. Please enter your API key.".to_string());
        }
        if settings.azure_deployment.is_empty() {
            return Err("Error: Deployment name is empty. Please enter your deployment name.".to_string());
        }

        if !settings.azure_endpoint.starts_with("http://") && !settings.azure_endpoint.starts_with("https://") {
            return Err("Error: Invalid endpoint URL. Make sure it starts with https:// (e.g., https://your-resource.openai.azure.com)".to_string());
        }

        let url = format!(
            "{}/openai/deployments/{}/chat/completions?api-version=2025-01-01-preview",
            settings.azure_endpoint, settings.azure_deployment
        );

        let test_body = serde_json::json!({
            "messages": [{"role": "user", "content": "test"}],
            "max_tokens": 5,
            "stream": false
        });

        let response = client
            .post(&url)
            .header("api-key", &settings.azure_api_key)
            .header("Content-Type", "application/json")
            .json(&test_body)
            .send()
            .await
            .map_err(|e| {
                let err_msg = e.to_string();
                if err_msg.contains("dns error") || err_msg.contains("No such host") {
                    "Error: Cannot reach endpoint. Check if your endpoint URL is correct.".to_string()
                } else if err_msg.contains("Connection") {
                    "Error: Connection failed. Check your internet connection.".to_string()
                } else {
                    "Error: Network error. Please try again.".to_string()
                }
            })?;

        if response.status().is_success() {
            println!("[SETTINGS] Azure credentials valid");
            Ok("Azure OpenAI credentials verified successfully".to_string())
        } else {
            let status = response.status();
            println!("[SETTINGS] Azure credentials invalid: {}", status);

            match status.as_u16() {
                401 => Err("Error: Invalid API key. Please check your Azure API key.".to_string()),
                404 => Err("Error: Deployment not found. Check your deployment name.".to_string()),
                403 => Err("Error: Access denied. Check your API key permissions.".to_string()),
                _ => Err("Error: Incorrect endpoint, API key, or deployment name. Please verify your credentials.".to_string())
            }
        }
    } else {
        if settings.openai_api_key.is_empty() {
            return Err("Error: OpenAI API key is empty. Please enter your API key.".to_string());
        }

        let url = "https://api.openai.com/v1/chat/completions";

        let test_body = serde_json::json!({
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": "test"}],
            "max_tokens": 5,
            "stream": false
        });

        let response = client
            .post(url)
            .header("Authorization", format!("Bearer {}", settings.openai_api_key))
            .header("Content-Type", "application/json")
            .json(&test_body)
            .send()
            .await
            .map_err(|_| "Error: Connection failed. Check your internet connection.".to_string())?;

        if response.status().is_success() {
            println!("[SETTINGS] OpenAI credentials valid");
            Ok("OpenAI credentials verified successfully".to_string())
        } else {
            let status = response.status();
            println!("[SETTINGS] OpenAI credentials invalid: {}", status);

            match status.as_u16() {
                401 => Err("Error: Invalid OpenAI API key. Please check your API key.".to_string()),
                429 => Err("Error: Rate limit exceeded. Please try again later.".to_string()),
                _ => Err("Error: Incorrect API key. Please verify your OpenAI credentials.".to_string())
            }
        }
    }
}
