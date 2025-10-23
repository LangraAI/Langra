use anyhow::Result;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::env;

#[derive(Serialize)]
struct AzureRequest {
    messages: Vec<Message>,
    max_tokens: i32,
    temperature: f32,
    tools: Vec<Tool>,
    tool_choice: String,
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
struct AzureResponse {
    choices: Vec<Choice>,
}

#[derive(Deserialize)]
struct Choice {
    message: ResponseMessage,
}

#[derive(Deserialize)]
struct ResponseMessage {
    tool_calls: Option<Vec<ToolCall>>,
}

#[derive(Deserialize)]
struct ToolCall {
    function: FunctionCall,
}

#[derive(Deserialize)]
struct FunctionCall {
    arguments: String,
}

#[derive(Deserialize)]
struct LanguageResult {
    language: String,
}

pub async fn detect_language(text: &str) -> Result<String> {
    println!("[LANGUAGE_DETECTOR] Detecting language for text: '{}'", &text[..text.len().min(100)]);

    let azure_endpoint = env::var("AZURE_OPENAI_ENDPOINT")?;
    let azure_key = env::var("AZURE_OPENAI_API_KEY")?;
    let deployment_name = env::var("AZURE_OPENAI_DEPLOYMENT").unwrap_or_else(|_| "gpt-4o-mini".to_string());

    let url = format!(
        "{}/openai/deployments/{}/chat/completions?api-version=2025-01-01-preview",
        azure_endpoint, deployment_name
    );

    let client = Client::new();

    let tools = vec![Tool {
        tool_type: "function".to_string(),
        function: Function {
            name: "detect_language".to_string(),
            description: "Classify the language of text as 'en' for English, 'de' for German, or 'other' for any other language".to_string(),
            parameters: FunctionParameters {
                param_type: "object".to_string(),
                properties: serde_json::json!({
                    "language": {
                        "type": "string",
                        "enum": ["en", "de", "other"],
                        "description": "The detected language code"
                    }
                }),
                required: vec!["language".to_string()],
            },
        },
    }];

    let request_body = AzureRequest {
        messages: vec![Message {
            role: "user".to_string(),
            content: format!("Detect the language of this text and call the detect_language function with the appropriate language code: {}", text),
        }],
        max_tokens: 100,
        temperature: 0.0,
        tools,
        tool_choice: "auto".to_string(),
    };

    let response = client
        .post(&url)
        .header("api-key", azure_key)
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await?;

    let azure_response: AzureResponse = response.json().await?;

    if let Some(choice) = azure_response.choices.first() {
        if let Some(tool_calls) = &choice.message.tool_calls {
            if let Some(tool_call) = tool_calls.first() {
                let result: LanguageResult = serde_json::from_str(&tool_call.function.arguments)?;
                println!("[LANGUAGE_DETECTOR] Detected language: {}", result.language);
                return Ok(result.language);
            }
        }
    }

    println!("[LANGUAGE_DETECTOR] Failed to detect language, defaulting to 'en'");
    Ok("en".to_string())
}

pub fn detect_language_fallback(text: &str) -> String {
    let german_chars = ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'];

    for ch in text.chars() {
        if german_chars.contains(&ch) {
            return "de".to_string();
        }
    }

    "en".to_string()
}
