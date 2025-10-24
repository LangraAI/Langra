use anyhow::{Result, anyhow};
use futures_util::StreamExt;
use reqwest::Client;
use serde::{de::DeserializeOwned, Serialize};
use tauri::{AppHandle, Emitter};
use crate::settings;
use super::types::{AzureRequest, Message, Tool, StreamResponse};

fn extract_partial_text(json: &str, field_name: &str) -> Option<String> {
    let pattern = format!("\"{}\":\"", field_name);
    let start_idx = json.find(&pattern)?;
    let text_start = start_idx + pattern.len();
    let remaining = &json[text_start..];

    let mut result = String::new();
    let mut chars = remaining.chars();
    let mut escape_next = false;

    while let Some(ch) = chars.next() {
        if escape_next {
            match ch {
                'n' => result.push('\n'),
                't' => result.push('\t'),
                'r' => result.push('\r'),
                '"' => result.push('"'),
                '\\' => result.push('\\'),
                _ => {
                    result.push('\\');
                    result.push(ch);
                }
            }
            escape_next = false;
        } else if ch == '\\' {
            escape_next = true;
        } else if ch == '"' {
            break;
        } else {
            result.push(ch);
        }
    }

    if result.is_empty() {
        None
    } else {
        Some(result)
    }
}

pub async fn call_openai<T: DeserializeOwned + Serialize>(
    system_prompt: String,
    user_text: String,
    tool: Tool,
    tool_name: &str,
    app: &AppHandle,
) -> Result<T> {
    let field_name = match tool_name {
        "provide_translation" => "translated_text",
        "provide_corrected_text" => "corrected_text",
        "provide_improved_text" => "improved_text",
        _ => "translated_text",
    };
    let settings = settings::load_settings();

    let client = Client::new();
    let request_body = AzureRequest {
        messages: vec![
            Message {
                role: "system".to_string(),
                content: system_prompt,
            },
            Message {
                role: "user".to_string(),
                content: user_text,
            }
        ],
        max_tokens: 4000,
        temperature: 0.3,
        stream: true,
        tools: vec![tool],
        tool_choice: serde_json::json!({"type": "function", "function": {"name": tool_name}}),
    };

    let response = if settings.provider == "azure" {
        if settings.azure_endpoint.is_empty() || settings.azure_api_key.is_empty() {
            return Err(anyhow!("Azure OpenAI credentials not configured. Please open Settings and add your API key."));
        }

        let url = format!(
            "{}/openai/deployments/{}/chat/completions?api-version=2025-01-01-preview",
            settings.azure_endpoint, settings.azure_deployment
        );

        client
            .post(&url)
            .header("api-key", &settings.azure_api_key)
            .header("Content-Type", "application/json")
            .json(&request_body)
            .send()
            .await?
    } else {
        if settings.openai_api_key.is_empty() {
            return Err(anyhow!("OpenAI API key not configured. Please open Settings and add your API key."));
        }

        let url = "https://api.openai.com/v1/chat/completions";

        client
            .post(url)
            .header("Authorization", format!("Bearer {}", settings.openai_api_key))
            .header("Content-Type", "application/json")
            .json(&request_body)
            .send()
            .await?
    };

    let mut stream = response.bytes_stream();
    let mut full_arguments = String::new();
    let mut incomplete_line = String::new();
    let mut last_emitted_length = 0;

    while let Some(chunk_result) = stream.next().await {
        match chunk_result {
            Ok(chunk) => {
                let chunk_str = String::from_utf8_lossy(&chunk);
                let text_to_process = format!("{}{}", incomplete_line, chunk_str);
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
                                if let Some(tool_calls) = &choice.delta.tool_calls {
                                    if let Some(tool_call) = tool_calls.first() {
                                        if let Some(function) = &tool_call.function {
                                            if let Some(args) = &function.arguments {
                                                full_arguments.push_str(args);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                if chunk_str.ends_with('\n') {
                    incomplete_line.clear();
                }

                if let Some(partial_text) = extract_partial_text(&full_arguments, field_name) {
                    if partial_text.len() > last_emitted_length {
                        println!("[STREAMING] Emitting partial text (length: {})", partial_text.len());
                        last_emitted_length = partial_text.len();
                        let _ = app.emit("translation-partial", partial_text);
                    }
                } else if !full_arguments.is_empty() {
                    println!("[STREAMING] Could not extract partial text from: {}", full_arguments);
                }
            }
            Err(e) => {
                println!("[API] Stream error: {:?}", e);
                break;
            }
        }
    }

    if !full_arguments.is_empty() {
        match serde_json::from_str::<T>(&full_arguments) {
            Ok(result) => Ok(result),
            Err(e) => {
                println!("[API] ❌ Failed to parse arguments: {}", e);
                println!("[API] Raw arguments: {}", full_arguments);
                Err(anyhow!("Failed to parse result"))
            }
        }
    } else {
        Err(anyhow!("No response received"))
    }
}
