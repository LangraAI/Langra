mod language_detector;
mod translator;
mod utils;
mod windows;
mod insertion;
mod keyboard_monitor;
mod settings;

use once_cell::sync::OnceCell;
use parking_lot::Mutex;
use tauri::{AppHandle, Emitter, Listener};

pub static APP_HANDLE: OnceCell<AppHandle> = OnceCell::new();
static CURRENT_MODE: Mutex<String> = Mutex::new(String::new());

#[tauri::command]
fn set_mode(mode: String) {
    println!("[MODE] Setting mode to: {}", mode);
    *CURRENT_MODE.lock() = mode;
}

#[tauri::command]
fn get_mode() -> String {
    let mode = CURRENT_MODE.lock().clone();
    if mode.is_empty() {
        "translate".to_string()
    } else {
        mode
    }
}

#[tauri::command]
fn copy_to_clipboard(text: String) -> Result<(), String> {
    use arboard::Clipboard;
    let mut clipboard = Clipboard::new().map_err(|e| e.to_string())?;
    clipboard.set_text(text).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn open_input_monitoring_settings() {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        let _ = Command::new("open")
            .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_ListenEvent")
            .spawn();
    }
}

#[tauri::command]
fn open_url(url: String) -> Result<(), String> {
    use std::process::Command;

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&url)
            .spawn()
            .map_err(|e| format!("Failed to open URL: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(&["/C", "start", &url])
            .spawn()
            .map_err(|e| format!("Failed to open URL: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(|e| format!("Failed to open URL: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
async fn verify_access_token(token: String) -> Result<serde_json::Value, String> {
    println!("[AUTH] Verifying access token...");

    let client = reqwest::Client::new();
    let response = client
        .post("http://localhost:3000/api/tokens/verify")
        .json(&serde_json::json!({
            "token": token
        }))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if response.status().is_success() {
        let result: serde_json::Value = response.json().await
            .map_err(|e| format!("Failed to parse response: {}", e))?;
        println!("[AUTH] Token verified successfully");
        Ok(result)
    } else {
        Err("Invalid token".to_string())
    }
}

#[tauri::command]
async fn save_access_token(token: String) -> Result<(), String> {
    println!("[AUTH] Saving access token...");

    use std::fs;
    use std::path::PathBuf;
    use std::time::{SystemTime, UNIX_EPOCH};

    let app_dir = dirs::data_dir()
        .ok_or("Failed to get app data directory")?
        .join("langra");

    fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;

    let token_path = app_dir.join("access_token");
    println!("[AUTH] Token path: {:?}", token_path);

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let token_data = serde_json::json!({
        "token": token,
        "created_at": timestamp
    });

    fs::write(&token_path, token_data.to_string()).map_err(|e| e.to_string())?;
    println!("[AUTH] Access token saved successfully");

    Ok(())
}

#[tauri::command]
fn get_access_token() -> Result<String, String> {
    use std::fs;
    use std::path::PathBuf;
    use std::time::{SystemTime, UNIX_EPOCH};

    let app_dir = dirs::data_dir()
        .ok_or("Failed to get app data directory")?
        .join("langra");

    let token_path = app_dir.join("access_token");

    if !token_path.exists() {
        return Err("No access token found".to_string());
    }

    let content = fs::read_to_string(&token_path)
        .map_err(|e| format!("Failed to read token: {}", e))?;

    let token_data: serde_json::Value = serde_json::from_str(&content)
        .map_err(|_| "Invalid token format".to_string())?;

    let token = token_data["token"]
        .as_str()
        .ok_or("Token field missing")?
        .to_string();

    let created_at = token_data["created_at"]
        .as_u64()
        .ok_or("Created at field missing")?;

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let three_months_in_seconds = 90 * 24 * 60 * 60;

    if now - created_at > three_months_in_seconds {
        println!("[AUTH] Token expired (older than 3 months)");
        fs::remove_file(&token_path).ok();
        return Err("Token expired".to_string());
    }

    Ok(token)
}

#[tauri::command]
async fn login_and_get_token(email: String, password: String) -> Result<serde_json::Value, String> {
    println!("[AUTH] Logging in with email: {}", email);

    let client = reqwest::Client::new();

    let login_response = client
        .post("http://localhost:3000/api/auth/login")
        .json(&serde_json::json!({
            "email": email,
            "password": password
        }))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !login_response.status().is_success() {
        return Err("Invalid email or password".to_string());
    }

    let login_result: serde_json::Value = login_response.json().await
        .map_err(|e| format!("Failed to parse login response: {}", e))?;

    let session_token = login_result.get("access_token")
        .and_then(|t| t.as_str())
        .ok_or("No access token in login response")?;

    println!("[AUTH] Login successful, generating token...");

    let token_response = client
        .post("http://localhost:3000/api/tokens/generate")
        .header("Authorization", format!("Bearer {}", session_token))
        .json(&serde_json::json!({
            "deviceName": "Langra Desktop"
        }))
        .send()
        .await
        .map_err(|e| format!("Failed to generate token: {}", e))?;

    if !token_response.status().is_success() {
        return Err("Failed to generate access token".to_string());
    }

    let token_result: serde_json::Value = token_response.json().await
        .map_err(|e| format!("Failed to parse token response: {}", e))?;

    let token = token_result.get("token")
        .and_then(|t| t.as_str())
        .ok_or("No token in response")?;

    save_access_token(token.to_string()).await?;

    println!("[AUTH] Token saved successfully");
    Ok(serde_json::json!({"success": true}))
}

#[tauri::command]
async fn signup_and_get_token(email: String, password: String) -> Result<serde_json::Value, String> {
    println!("[AUTH] Signing up with email: {}", email);

    let client = reqwest::Client::new();

    let signup_response = client
        .post("http://localhost:3000/api/auth/signup")
        .json(&serde_json::json!({
            "email": email,
            "password": password
        }))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !signup_response.status().is_success() {
        let error_text = signup_response.text().await
            .unwrap_or_else(|_| "Failed to create account".to_string());
        return Err(error_text);
    }

    let signup_result: serde_json::Value = signup_response.json().await
        .map_err(|e| format!("Failed to parse signup response: {}", e))?;

    let session_token = signup_result.get("access_token")
        .and_then(|t| t.as_str())
        .ok_or("No access token in signup response")?;

    println!("[AUTH] Signup successful, generating token...");

    let token_response = client
        .post("http://localhost:3000/api/tokens/generate")
        .header("Authorization", format!("Bearer {}", session_token))
        .json(&serde_json::json!({
            "deviceName": "Langra Desktop"
        }))
        .send()
        .await
        .map_err(|e| format!("Failed to generate token: {}", e))?;

    if !token_response.status().is_success() {
        return Err("Failed to generate access token".to_string());
    }

    let token_result: serde_json::Value = token_response.json().await
        .map_err(|e| format!("Failed to parse token response: {}", e))?;

    let token = token_result.get("token")
        .and_then(|t| t.as_str())
        .ok_or("No token in response")?;

    save_access_token(token.to_string()).await?;

    println!("[AUTH] Token saved successfully");
    Ok(serde_json::json!({"success": true}))
}

#[tauri::command]
fn oauth_login(provider: String) -> Result<serde_json::Value, String> {
    println!("[AUTH] Starting OAuth with provider: {}", provider);

    let auth_url = format!(
        "http://localhost:3000/api/auth/oauth?provider={}",
        provider
    );

    open_url(auth_url)?;

    println!("[AUTH] OAuth flow initiated in browser. User will authenticate and token will be sent via deep link.");

    Ok(serde_json::json!({"success": true}))
}

#[tauri::command]
async fn enhance_text_with_instruction(
    text: String,
    language: String,
    instruction: String,
    app: AppHandle,
) {
    use tauri::Emitter;

    println!("[ENHANCE_CUSTOM] Starting custom enhancement with instruction: {}", instruction);
    match translator::enhance_stream_with_instruction(&text, &language, &instruction, &app).await {
        Ok(enhanced) => {
            println!("[ENHANCE_CUSTOM] ✅ Enhancement complete: '{}'", enhanced);
            let _ = app.emit("translation-complete", ());
        }
        Err(e) => {
            println!("[ENHANCE_CUSTOM] ❌ Enhancement error: {:?}", e);
            let _ = app.emit("translation-error", e.to_string());
        }
    }
}

pub async fn trigger_translation(app: &AppHandle) {
    use tauri::Emitter;

    println!("[TRIGGER] Translation triggered");

    println!("[TRIGGER] Opening window immediately...");
    windows::show_translator_window(true);

    tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;

    println!("[TRIGGER] Checking credentials...");
    let settings = settings::load_settings();
    let has_api_key = if settings.provider == "azure" {
        !settings.azure_endpoint.is_empty() && !settings.azure_api_key.is_empty()
    } else {
        !settings.openai_api_key.is_empty()
    };

    let has_access_token = match get_access_token() {
        Ok(_) => true,
        Err(_) => false,
    };

    if !has_api_key && !has_access_token {
        println!("[TRIGGER] No credentials configured, showing welcome screen");
        let _ = app.emit("credentials-missing", ());
        return;
    }

    if has_access_token && !has_api_key {
        println!("[TRIGGER] Using Langra account (access token found)");
    }

    println!("[TRIGGER] Reading clipboard (first Cmd+C already copied it)");

    use arboard::Clipboard;
    let selected_text = match Clipboard::new() {
        Ok(mut clipboard) => match clipboard.get_text() {
            Ok(text) => {
                println!("[TRIGGER] Got text from clipboard: '{}'", text);
                text
            },
            Err(e) => {
                println!("[TRIGGER] Error reading clipboard: {:?}", e);
                String::new()
            }
        },
        Err(e) => {
            println!("[TRIGGER] Error creating clipboard: {:?}", e);
            String::new()
        }
    };

    if !selected_text.is_empty() {
        println!("[TRIGGER] Translating text: '{}'", selected_text);

        let lang = match language_detector::detect_language(&selected_text).await {
            Ok(detected_lang) => detected_lang,
            Err(e) => {
                println!("[TRIGGER] Language detection failed, using fallback: {:?}", e);
                language_detector::detect_language_fallback(&selected_text)
            }
        };

        println!("[TRIGGER] Detected language: {}", lang);

        #[derive(serde::Serialize, Clone)]
        struct TranslationStartPayload {
            detected_language: String,
            original_text: String,
        }

        let _ = app.emit("translation-start", TranslationStartPayload {
            detected_language: lang.clone(),
            original_text: selected_text.clone(),
        });

        tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;

        let current_mode = get_mode();
        println!("[TRIGGER] Current mode: {}", current_mode);

        if current_mode == "enhance" {
            println!("[TRIGGER] Using fix mode");
            match translator::enhance_stream(&selected_text, &lang, app).await {
                Ok(enhanced) => {
                    println!("[TRIGGER] ✅ Fix complete: '{}'", enhanced);
                    let _ = app.emit("translation-complete", ());
                }
                Err(e) => {
                    println!("[TRIGGER] ❌ Fix error: {:?}", e);
                    let _ = app.emit("translation-error", e.to_string());
                }
            }
        } else {
            println!("[TRIGGER] Using translate mode");
            match translator::translate_stream(&selected_text, &lang, app).await {
                Ok(translation) => {
                    println!("[TRIGGER] ✅ Translation complete: '{}'", translation);
                    let _ = app.emit("translation-complete", ());
                }
                Err(e) => {
                    let error_msg = e.to_string();
                    println!("[TRIGGER] ❌ Translation error: {:?}", e);

                    if error_msg.contains("relative URL without a base")
                        || error_msg.contains("Invalid Azure credentials")
                        || error_msg.contains("Invalid OpenAI credentials")
                        || error_msg.contains("401")
                        || error_msg.contains("403") {

                        println!("[TRIGGER] ⚠️ Invalid credentials detected, clearing settings...");

                        let current_settings = settings::load_settings();

                        let cleared_settings = settings::Settings {
                            provider: current_settings.provider,
                            openai_api_key: String::new(),
                            azure_endpoint: String::new(),
                            azure_api_key: String::new(),
                            azure_deployment: current_settings.azure_deployment,
                            style: current_settings.style,
                        };

                        if let Err(save_err) = settings::save_settings_to_disk(&cleared_settings) {
                            eprintln!("[TRIGGER] Failed to clear credentials: {}", save_err);
                        } else {
                            println!("[TRIGGER] ✅ Credentials cleared, showing welcome screen");
                            let _ = app.emit("credentials-missing", ());
                        }
                    }

                    let _ = app.emit("translation-error", error_msg);
                }
            }
        }
    } else {
        println!("[TRIGGER] No text selected, closing window");
        let _ = app.emit("translation-error", "No text selected".to_string());
    }
}

#[tauri::command]
async fn show_translator_with_selected_text() {
    let app = APP_HANDLE.get().unwrap();
    trigger_translation(app).await;
}

#[tauri::command]
async fn retranslate(text: String, source_lang: String) {
    use tauri::Emitter;
    let app = APP_HANDLE.get().unwrap();

    println!("[RETRANSLATE] Retranslating text with source_lang: {}", source_lang);

    match translator::translate_stream(&text, &source_lang, app).await {
        Ok(translation) => {
            println!("[RETRANSLATE] ✅ Translation complete: '{}'", translation);
            let _ = app.emit("translation-complete", ());
        }
        Err(e) => {
            let error_msg = e.to_string();
            println!("[RETRANSLATE] ❌ Translation error: {:?}", e);

            if error_msg.contains("relative URL without a base")
                || error_msg.contains("Invalid Azure credentials")
                || error_msg.contains("Invalid OpenAI credentials")
                || error_msg.contains("401")
                || error_msg.contains("403") {

                println!("[RETRANSLATE] ⚠️ Invalid credentials detected, clearing settings...");

                let current_settings = settings::load_settings();

                let cleared_settings = settings::Settings {
                    provider: current_settings.provider,
                    openai_api_key: String::new(),
                    azure_endpoint: String::new(),
                    azure_api_key: String::new(),
                    azure_deployment: current_settings.azure_deployment,
                    style: current_settings.style,
                };

                if let Err(save_err) = settings::save_settings_to_disk(&cleared_settings) {
                    eprintln!("[RETRANSLATE] Failed to clear credentials: {}", save_err);
                } else {
                    println!("[RETRANSLATE] ✅ Credentials cleared, showing welcome screen");
                    let _ = app.emit("credentials-missing", ());
                }
            }

            let _ = app.emit("translation-error", error_msg);
        }
    }
}

#[tauri::command]
async fn enhance_text(text: String, language: String) {
    use tauri::Emitter;
    let app = APP_HANDLE.get().unwrap();

    println!("[FIX] Fixing {} text: '{}'", language, &text[..text.len().min(100)]);

    match translator::enhance_stream(&text, &language, app).await {
        Ok(enhanced) => {
            println!("[FIX] ✅ Fix complete: '{}'", enhanced);
            let _ = app.emit("translation-complete", ());
        }
        Err(e) => {
            println!("[FIX] ❌ Fix error: {:?}", e);
            let _ = app.emit("translation-error", e.to_string());
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    dotenvy::dotenv().ok();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            let handle = app.handle().clone();
            APP_HANDLE.get_or_init(|| handle.clone());

            let handle_clone = handle.clone();
            app.listen("deep-link://new-url", move |event| {
                let payload = event.payload();
                println!("[DEEP_LINK] Received event, payload: {}", payload);

                if let Ok(urls) = serde_json::from_str::<Vec<String>>(payload) {
                    for url_str in urls {
                        println!("[DEEP_LINK] Received URL: {}", url_str);

                        if let Ok(url) = url::Url::parse(&url_str) {
                            if url.scheme() == "langra" && url.host_str() == Some("auth") {
                                if let Some(token) = url.query_pairs()
                                    .find(|(key, _)| key == "token")
                                    .map(|(_, value)| value.to_string())
                                {
                                    println!("[DEEP_LINK] Received token, saving...");

                                    let handle_for_save = handle_clone.clone();
                                    tauri::async_runtime::spawn(async move {
                                        match save_access_token(token).await {
                                            Ok(_) => {
                                                println!("[DEEP_LINK] Token saved successfully");
                                                let _ = handle_for_save.emit("auth-success", ());
                                            }
                                            Err(e) => {
                                                println!("[DEEP_LINK] Failed to save token: {}", e);
                                            }
                                        }
                                    });
                                }
                            }
                        }
                    }
                }
            });

            println!("[SETUP] Creating translator window at startup...");
            let window = windows::get_translator_window(false);

            // Prevent window close from quitting the app
            let window_clone = window.clone();
            window.on_window_event(move |event| {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    println!("[WINDOW] Close requested, hiding instead of quitting");
                    window_clone.hide().unwrap();
                    api.prevent_close();
                }
            });

            window.hide().unwrap();
            println!("[SETUP] Translator window created and hidden");

            #[cfg(target_os = "macos")]
            {
                println!("[PERMISSIONS] Requesting Input Monitoring permission...");

                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_secs(1));

                    #[link(name = "CoreGraphics", kind = "framework")]
                    extern "C" {
                        fn CGRequestListenEventAccess() -> u8;
                        fn CGPreflightListenEventAccess() -> u8;
                    }

                    unsafe {
                        if CGPreflightListenEventAccess() == 0 {
                            println!("[PERMISSIONS] No permission yet, requesting...");
                            let granted = CGRequestListenEventAccess();
                            println!("[PERMISSIONS] Permission {}", if granted != 0 { "granted" } else { "denied" });
                        } else {
                            println!("[PERMISSIONS] Permission already granted");
                        }
                    }
                });
            }

            keyboard_monitor::start_listener(handle);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            copy_to_clipboard,
            open_input_monitoring_settings,
            open_url,
            show_translator_with_selected_text,
            retranslate,
            enhance_text,
            set_mode,
            get_mode,
            insertion::insert_translation_into_previous_input,
            windows::hide_translator_window,
            windows::set_always_on_top,
            settings::get_settings,
            settings::save_settings,
            settings::test_api_credentials,
            enhance_text_with_instruction,
            verify_access_token,
            save_access_token,
            get_access_token,
            login_and_get_token,
            signup_and_get_token,
            oauth_login,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
