use anyhow::Result;
use crate::get_access_token;

pub async fn detect_language(text: &str) -> Result<String> {
    println!("[DETECT_LANG] Detecting language for text (first 100 chars): '{}'", &text[..text.len().min(100)]);

    let token = get_access_token().map_err(|e| anyhow::anyhow!(e))?;

    let client = reqwest::Client::new();
    let response = client
        .post("http://localhost:3000/api/detect-language")
        .header("Authorization", format!("Bearer {}", token))
        .json(&serde_json::json!({
            "text": text,
        }))
        .send()
        .await?;

    if !response.status().is_success() {
        let error_text = response.text().await?;
        println!("[DETECT_LANG] Detection failed: {}, falling back to 'en'", error_text);
        return Ok("en".to_string());
    }

    let result: serde_json::Value = response.json().await?;
    let detected_lang = result["language"]
        .as_str()
        .unwrap_or("en")
        .to_string();

    println!("[DETECT_LANG] Detected language: {}", detected_lang);
    Ok(detected_lang)
}
