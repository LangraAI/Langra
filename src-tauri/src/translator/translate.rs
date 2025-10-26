use anyhow::Result;
use tauri::{AppHandle, Emitter};
use crate::get_access_token;

pub async fn translate_stream(text: &str, source_lang: &str, app: &AppHandle) -> Result<String> {
    println!("[TRANSLATOR] Starting translation...");
    println!("[TRANSLATOR] Source language: {}", source_lang);

    let token = get_access_token().map_err(|e| anyhow::anyhow!(e))?;
    let target_lang = if source_lang == "de" { "en" } else { "de" };

    println!("[TRANSLATOR] Using backend API");

    let client = reqwest::Client::new();
    let response = client
        .post("http://localhost:3000/api/translate")
        .header("Authorization", format!("Bearer {}", token))
        .json(&serde_json::json!({
            "text": text,
            "source_lang": source_lang,
            "target_lang": target_lang,
        }))
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
                        let _ = app.emit("translation-partial", result.clone());
                    }
                }
            }
        }
    }

    Ok(result)
}
