use anyhow::{Result, anyhow};
use futures_util::StreamExt;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use crate::settings;

fn estimate_tokens(text: &str) -> usize {
    (text.len() as f32 / 4.0).ceil() as usize
}

fn chunk_by_paragraphs(text: &str, max_tokens: usize) -> Vec<String> {
    if estimate_tokens(text) <= max_tokens {
        return vec![text.to_string()];
    }

    let paragraphs: Vec<&str> = text.split("\n\n").collect();
    let mut chunks = Vec::new();
    let mut current = String::new();

    for paragraph in paragraphs {
        let combined = if current.is_empty() {
            paragraph.to_string()
        } else {
            format!("{}\n\n{}", current, paragraph)
        };

        if estimate_tokens(&combined) > max_tokens {
            if !current.is_empty() {
                chunks.push(current);
                current = paragraph.to_string();
            } else {
                chunks.push(paragraph.to_string());
            }
        } else {
            current = combined;
        }
    }

    if !current.is_empty() {
        chunks.push(current);
    }

    chunks
}

#[derive(Serialize)]
struct AzureRequest {
    messages: Vec<Message>,
    max_tokens: i32,
    temperature: f32,
    stream: bool,
    tools: Vec<Tool>,
    tool_choice: serde_json::Value,
}

#[derive(Serialize, Deserialize)]
struct Message {
    role: String,
    content: String,
}

#[derive(Serialize)]
struct Tool {
    #[serde(rename = "type")]
    tool_type: String,
    function: Function,
}

#[derive(Serialize)]
struct Function {
    name: String,
    description: String,
    parameters: FunctionParameters,
}

#[derive(Serialize)]
struct FunctionParameters {
    #[serde(rename = "type")]
    param_type: String,
    properties: serde_json::Value,
    required: Vec<String>,
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
    tool_calls: Option<Vec<ToolCallDelta>>,
}

#[derive(Deserialize)]
struct ToolCallDelta {
    index: Option<usize>,
    function: Option<FunctionDelta>,
}

#[derive(Deserialize)]
struct FunctionDelta {
    name: Option<String>,
    arguments: Option<String>,
}

#[derive(Deserialize)]
struct TranslationResult {
    translated_text: String,
}

#[derive(Deserialize)]
struct CorrectionResult {
    corrected_text: String,
}

#[derive(Deserialize)]
struct ImprovementResult {
    improved_text: String,
}

fn create_translation_tool(source_lang_name: &str, target_lang_name: &str) -> Tool {
    Tool {
        tool_type: "function".to_string(),
        function: Function {
            name: "provide_translation".to_string(),
            description: format!("Return the {} to {} translation", source_lang_name, target_lang_name),
            parameters: FunctionParameters {
                param_type: "object".to_string(),
                properties: serde_json::json!({
                    "translated_text": {
                        "type": "string",
                        "description": "The translated text"
                    }
                }),
                required: vec!["translated_text".to_string()],
            },
        },
    }
}

fn create_correction_tool(lang_name: &str) -> Tool {
    Tool {
        tool_type: "function".to_string(),
        function: Function {
            name: "provide_corrected_text".to_string(),
            description: format!("Return the corrected {} text", lang_name),
            parameters: FunctionParameters {
                param_type: "object".to_string(),
                properties: serde_json::json!({
                    "corrected_text": {
                        "type": "string",
                        "description": "The corrected text with grammar and spelling fixed"
                    }
                }),
                required: vec!["corrected_text".to_string()],
            },
        },
    }
}

fn create_improvement_tool(lang_name: &str) -> Tool {
    Tool {
        tool_type: "function".to_string(),
        function: Function {
            name: "provide_improved_text".to_string(),
            description: format!("Return the improved {} text", lang_name),
            parameters: FunctionParameters {
                param_type: "object".to_string(),
                properties: serde_json::json!({
                    "improved_text": {
                        "type": "string",
                        "description": "The improved text after applying the instruction"
                    }
                }),
                required: vec!["improved_text".to_string()],
            },
        },
    }
}


async fn translate_chunk(text: &str, source_lang_name: &str, target_lang_name: &str) -> Result<String> {

    println!("[TRANSLATOR] Loading settings...");
    let settings = settings::load_settings();

    let style_instruction = match settings.style.as_str() {
        "formal" => "Use formal register.",
        "casual" => "Use informal register.",
        _ => "",
    };

    let system_prompt = if style_instruction.is_empty() {
        format!("Translate the following {} text to {}:", source_lang_name, target_lang_name)
    } else {
        format!("Translate the following {} text to {}. {}", source_lang_name, target_lang_name, style_instruction)
    };

    let client = Client::new();
    let request_body = AzureRequest {
        messages: vec![
            Message {
                role: "system".to_string(),
                content: system_prompt,
            },
            Message {
                role: "user".to_string(),
                content: text.to_string(),
            }
        ],
        max_tokens: 4000,
        temperature: 0.3,
        stream: true,
        tools: vec![create_translation_tool(source_lang_name, target_lang_name)],
        tool_choice: serde_json::json!({"type": "function", "function": {"name": "provide_translation"}}),
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
    let mut full_arguments = String::new();
    let mut incomplete_line = String::new();

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
            }
            Err(e) => {
                println!("[TRANSLATOR] Stream error: {:?}", e);
                break;
            }
        }
    }

    if !full_arguments.is_empty() {
        match serde_json::from_str::<TranslationResult>(&full_arguments) {
            Ok(result) => {
                println!("[TRANSLATOR] ✅ Translation complete: '{}'", result.translated_text);
                Ok(result.translated_text)
            }
            Err(e) => {
                println!("[TRANSLATOR] ❌ Failed to parse arguments: {}", e);
                println!("[TRANSLATOR] Raw arguments: {}", full_arguments);
                Err(anyhow!("Failed to parse translation result"))
            }
        }
    } else {
        Err(anyhow!("No translation received"))
    }
}

pub async fn translate_stream(text: &str, source_lang: &str, app: &AppHandle) -> Result<String> {
    println!("[TRANSLATOR] Starting translation...");
    println!("[TRANSLATOR] Source language: {}", source_lang);

    let target_lang = if source_lang == "de" { "en" } else { "de" };
    let source_lang_name = if source_lang == "de" { "German" } else { "English" };
    let target_lang_name = if target_lang == "de" { "German" } else { "English" };

    let chunks = chunk_by_paragraphs(text, 2500);

    if chunks.len() > 1 {
        println!("[TRANSLATOR] Split into {} chunks", chunks.len());
    }

    let mut results = Vec::new();
    for (i, chunk) in chunks.iter().enumerate() {
        if chunks.len() > 1 {
            println!("[TRANSLATOR] Translating chunk {}/{}", i + 1, chunks.len());
        }
        let result = translate_chunk(chunk, source_lang_name, target_lang_name).await?;
        results.push(result);
    }

    let final_result = results.join("\n\n");
    let _ = app.emit("translation-chunk", final_result.clone());
    Ok(final_result)
}

pub async fn enhance_stream_with_instruction(
    text: &str,
    language: &str,
    instruction: &str,
    app: &AppHandle,
) -> Result<String> {
    println!("[ENHANCE_CUSTOM] Starting text improvement with custom instruction...");
    println!("[ENHANCE_CUSTOM] Language: {}, Instruction: {}", language, instruction);

    let lang_name = if language == "de" { "German" } else { "English" };

    let settings = settings::load_settings();

    let system_prompt = format!(
        "Apply this improvement to the {} text: {}",
        lang_name, instruction
    );

    let client = Client::new();
    let request_body = AzureRequest {
        messages: vec![
            Message {
                role: "system".to_string(),
                content: system_prompt,
            },
            Message {
                role: "user".to_string(),
                content: text.to_string(),
            }
        ],
        max_tokens: 4000,
        temperature: 0.3,
        stream: true,
        tools: vec![create_improvement_tool(lang_name)],
        tool_choice: serde_json::json!({"type": "function", "function": {"name": "provide_improved_text"}}),
    };

    let response = if settings.provider == "azure" {
        println!("[ENHANCE_CUSTOM] Using Azure OpenAI provider:");
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
        println!("[ENHANCE_CUSTOM] Using OpenAI provider:");
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

    println!("[ENHANCE_CUSTOM] Response status: {}", response.status());

    let mut stream = response.bytes_stream();
    let mut full_arguments = String::new();
    let mut incomplete_line = String::new();

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
            }
            Err(e) => {
                println!("[ENHANCE_CUSTOM] Stream error: {:?}", e);
                break;
            }
        }
    }

    if !full_arguments.is_empty() {
        match serde_json::from_str::<ImprovementResult>(&full_arguments) {
            Ok(result) => {
                println!("[ENHANCE_CUSTOM] ✅ Improvement complete: '{}'", result.improved_text);
                let _ = app.emit("translation-chunk", result.improved_text.clone());
                Ok(result.improved_text)
            }
            Err(e) => {
                println!("[ENHANCE_CUSTOM] ❌ Failed to parse arguments: {}", e);
                println!("[ENHANCE_CUSTOM] Raw arguments: {}", full_arguments);
                Err(anyhow!("Failed to parse improvement result"))
            }
        }
    } else {
        Err(anyhow!("No improvement received"))
    }
}

pub async fn enhance_stream(text: &str, language: &str, app: &AppHandle) -> Result<String> {
    println!("[ENHANCE] Starting text correction...");
    println!("[ENHANCE] Language: {}", language);

    let lang_name = if language == "de" { "German" } else { "English" };

    println!("[ENHANCE] Loading settings...");
    let settings = settings::load_settings();

    let system_prompt = format!(
        "Correct any grammar and spelling errors in this {} text:",
        lang_name
    );

    let client = Client::new();
    let request_body = AzureRequest {
        messages: vec![
            Message {
                role: "system".to_string(),
                content: system_prompt,
            },
            Message {
                role: "user".to_string(),
                content: text.to_string(),
            }
        ],
        max_tokens: 4000,
        temperature: 0.3,
        stream: true,
        tools: vec![create_correction_tool(lang_name)],
        tool_choice: serde_json::json!({"type": "function", "function": {"name": "provide_corrected_text"}}),
    };

    let response = if settings.provider == "azure" {
        println!("[ENHANCE] Using Azure OpenAI provider:");
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
    let mut full_arguments = String::new();
    let mut incomplete_line = String::new();

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
            }
            Err(e) => {
                println!("[ENHANCE] Stream error: {:?}", e);
                break;
            }
        }
    }

    if !full_arguments.is_empty() {
        match serde_json::from_str::<CorrectionResult>(&full_arguments) {
            Ok(result) => {
                println!("[ENHANCE] ✅ Correction complete: '{}'", result.corrected_text);
                let _ = app.emit("translation-chunk", result.corrected_text.clone());
                Ok(result.corrected_text)
            }
            Err(e) => {
                println!("[ENHANCE] ❌ Failed to parse arguments: {}", e);
                println!("[ENHANCE] Raw arguments: {}", full_arguments);
                Err(anyhow!("Failed to parse correction result"))
            }
        }
    } else {
        Err(anyhow!("No correction received"))
    }
}
