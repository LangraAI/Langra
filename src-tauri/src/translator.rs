use anyhow::{Result, anyhow};
use futures_util::StreamExt;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use crate::settings;

#[derive(Serialize)]
struct AzureRequest {
    messages: Vec<Message>,
    max_tokens: i32,
    temperature: f32,
    stream: bool,
}

#[derive(Serialize, Deserialize)]
struct Message {
    role: String,
    content: String,
}

#[derive(Deserialize)]
struct StreamResponse {
    choices: Vec<StreamChoice>,
}

#[derive(Deserialize)]
struct StreamChoice {
    delta: Delta,
    finish_reason: Option<String>,
}

#[derive(Deserialize)]
struct Delta {
    content: Option<String>,
}

pub async fn translate_stream(text: &str, source_lang: &str, app: &AppHandle) -> Result<String> {
    println!("[TRANSLATOR] Starting streaming translation...");
    println!("[TRANSLATOR] Source language: {}", source_lang);

    let target_lang = if source_lang == "de" { "en" } else { "de" };
    println!("[TRANSLATOR] Target language: {}", target_lang);

    let prompt = format!(
        "Translate this {} text to {}. Return ONLY the translation:\n\n{}",
        source_lang, target_lang, text
    );

    println!("[TRANSLATOR] Loading settings...");
    let settings = settings::load_settings();

    let client = Client::new();
    let request_body = AzureRequest {
        messages: vec![Message {
            role: "user".to_string(),
            content: prompt.clone(),
        }],
        max_tokens: 2000,
        temperature: 0.3,
        stream: true,
    };

    let response = if settings.provider == "azure" {
        println!("[TRANSLATOR] Using Azure OpenAI provider");
        if settings.azure_endpoint.is_empty() || settings.azure_api_key.is_empty() {
            return Err(anyhow!("Azure OpenAI credentials not configured. Please open Settings and add your API key."));
        }

        let url = format!(
            "{}/openai/deployments/{}/chat/completions?api-version=2025-01-01-preview",
            settings.azure_endpoint, settings.azure_deployment
        );
        println!("[TRANSLATOR] Request URL: {}", url);

        client
            .post(&url)
            .header("api-key", &settings.azure_api_key)
            .header("Content-Type", "application/json")
            .json(&request_body)
            .send()
            .await?
    } else {
        println!("[TRANSLATOR] Using OpenAI provider");
        if settings.openai_api_key.is_empty() {
            return Err(anyhow!("OpenAI API key not configured. Please open Settings and add your API key."));
        }

        let url = "https://api.openai.com/v1/chat/completions";
        println!("[TRANSLATOR] Request URL: {}", url);

        client
            .post(url)
            .header("Authorization", format!("Bearer {}", settings.openai_api_key))
            .header("Content-Type", "application/json")
            .json(&request_body)
            .send()
            .await?
    };

    println!("[TRANSLATOR] Response status: {}", response.status());

    let mut stream = response.bytes_stream();
    let mut full_translation = String::new();
    let mut incomplete_line = String::new();

    while let Some(chunk_result) = stream.next().await {
        match chunk_result {
            Ok(chunk) => {
                let chunk_str = String::from_utf8_lossy(&chunk);
                let mut text_to_process = format!("{}{}", incomplete_line, chunk_str);

                let lines: Vec<&str> = text_to_process.split('\n').collect();

                for (i, line) in lines.iter().enumerate() {
                    if i == lines.len() - 1 && !chunk_str.ends_with('\n') {
                        incomplete_line = line.to_string();
                        break;
                    }

                    if line.starts_with("data: ") {
                        let data = &line[6..];

                        if data.trim() == "[DONE]" {
                            continue;
                        }

                        if let Ok(parsed) = serde_json::from_str::<StreamResponse>(data) {
                            if let Some(choice) = parsed.choices.first() {
                                if let Some(content) = &choice.delta.content {
                                    if !content.is_empty() {
                                        full_translation.push_str(content);
                                        let _ = app.emit("translation-chunk", content.clone());
                                    }
                                }
                            }
                        }
                    }
                }

                if chunk_str.ends_with('\n') {
                    incomplete_line.clear();
                }
            }
            Err(e) => {
                println!("[TRANSLATOR] Stream error: {:?}", e);
                break;
            }
        }
    }

    println!("[TRANSLATOR] ✅ Streaming complete: '{}'", full_translation);

    Ok(full_translation)
}

pub async fn enhance_stream(text: &str, language: &str, app: &AppHandle) -> Result<String> {
    println!("[ENHANCE] Starting text fix...");
    println!("[ENHANCE] Language: {}", language);

    let lang_name = if language == "de" { "German" } else { "English" };

    let prompt = format!(
        "Fix only grammar and spelling errors in the following {} text. Keep the exact same meaning, context, tone, and style. Do not enhance, improve, or change anything else. Return ONLY the corrected text without explanations:\n\n{}",
        lang_name, text
    );

    println!("[ENHANCE] Loading settings...");
    let settings = settings::load_settings();

    let client = Client::new();
    let request_body = AzureRequest {
        messages: vec![Message {
            role: "user".to_string(),
            content: prompt.clone(),
        }],
        max_tokens: 2000,
        temperature: 0.3,
        stream: true,
    };

    let response = if settings.provider == "azure" {
        println!("[ENHANCE] Using Azure OpenAI provider");
        if settings.azure_endpoint.is_empty() || settings.azure_api_key.is_empty() {
            return Err(anyhow!("Azure OpenAI credentials not configured. Please open Settings and add your API key."));
        }

        let url = format!(
            "{}/openai/deployments/{}/chat/completions?api-version=2025-01-01-preview",
            settings.azure_endpoint, settings.azure_deployment
        );
        println!("[ENHANCE] Request URL: {}", url);

        client
            .post(&url)
            .header("api-key", &settings.azure_api_key)
            .header("Content-Type", "application/json")
            .json(&request_body)
            .send()
            .await?
    } else {
        println!("[ENHANCE] Using OpenAI provider");
        if settings.openai_api_key.is_empty() {
            return Err(anyhow!("OpenAI API key not configured. Please open Settings and add your API key."));
        }

        let url = "https://api.openai.com/v1/chat/completions";
        println!("[ENHANCE] Request URL: {}", url);

        client
            .post(url)
            .header("Authorization", format!("Bearer {}", settings.openai_api_key))
            .header("Content-Type", "application/json")
            .json(&request_body)
            .send()
            .await?
    };

    println!("[ENHANCE] Response status: {}", response.status());

    let mut stream = response.bytes_stream();
    let mut full_enhanced = String::new();
    let mut incomplete_line = String::new();

    while let Some(chunk_result) = stream.next().await {
        match chunk_result {
            Ok(chunk) => {
                let chunk_str = String::from_utf8_lossy(&chunk);
                let mut text_to_process = format!("{}{}", incomplete_line, chunk_str);

                let lines: Vec<&str> = text_to_process.split('\n').collect();

                for (i, line) in lines.iter().enumerate() {
                    if i == lines.len() - 1 && !chunk_str.ends_with('\n') {
                        incomplete_line = line.to_string();
                        break;
                    }

                    if line.starts_with("data: ") {
                        let data = &line[6..];

                        if data.trim() == "[DONE]" {
                            continue;
                        }

                        if let Ok(parsed) = serde_json::from_str::<StreamResponse>(data) {
                            if let Some(choice) = parsed.choices.first() {
                                if let Some(content) = &choice.delta.content {
                                    if !content.is_empty() {
                                        full_enhanced.push_str(content);
                                        let _ = app.emit("translation-chunk", content.clone());
                                    }
                                }
                            }
                        }
                    }
                }

                if chunk_str.ends_with('\n') {
                    incomplete_line.clear();
                }
            }
            Err(e) => {
                println!("[ENHANCE] Stream error: {:?}", e);
                break;
            }
        }
    }

    println!("[ENHANCE] ✅ Fix complete: '{}'", full_enhanced);

    Ok(full_enhanced)
}
