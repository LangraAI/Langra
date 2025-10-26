use anyhow::Result;
use tauri::{AppHandle, Emitter};
use crate::get_access_token;

async fn enhance_with_backend_api(text: &str, language: &str, instruction: Option<&str>, token: &str, app: &AppHandle) -> Result<String> {
    println!("[ENHANCE] Using backend API");

    let client = reqwest::Client::new();
    let mut json_body = serde_json::json!({
        "text": text,
        "language": language,
    });

    if let Some(inst) = instruction {
        json_body["instruction"] = serde_json::json!(inst);
    }

    let response = client
        .post("http://localhost:3000/api/enhance")
        .header("Authorization", format!("Bearer {}", token))
        .json(&json_body)
        .send()
        .await?;

    if !response.status().is_success() {
        let error_text = response.text().await?;
        anyhow::bail!("Backend API error: {}", error_text);
    }

    let mut result = String::new();
    let mut stream = response.bytes_stream();

    use futures_util::StreamExt;
    while let Some(chunk) = stream.next().await {
        let chunk = chunk?;
        let chunk_str = String::from_utf8_lossy(&chunk);

        for line in chunk_str.lines() {
            if line.starts_with("data: ") {
                let data = &line[6..];
                if data == "[DONE]" {
                    break;
                }
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(data) {
                    if let Some(content) = json["content"].as_str() {
                        result = content.to_string();
                        let _ = app.emit("enhancement-partial", result.clone());
                    }
                }
            }
        }
    }

    Ok(result)
}

pub async fn enhance_stream_with_instruction(
    text: &str,
    language: &str,
    instruction: &str,
    app: &AppHandle,
) -> Result<String> {
    println!("[ENHANCE_CUSTOM] Starting text improvement with custom instruction...");
    println!("[ENHANCE_CUSTOM] Language: {}, Instruction: {}", language, instruction);

    let token = get_access_token().map_err(|e| anyhow::anyhow!(e))?;
    enhance_with_backend_api(text, language, Some(instruction), &token, app).await
}

pub async fn enhance_stream(text: &str, language: &str, app: &AppHandle) -> Result<String> {
    println!("[ENHANCE] Starting text correction...");
    println!("[ENHANCE] Language: {}", language);

    let token = get_access_token().map_err(|e| anyhow::anyhow!(e))?;
    enhance_with_backend_api(text, language, None, &token, app).await
}
