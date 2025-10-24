use anyhow::Result;
use tauri::{AppHandle, Emitter};
use crate::settings;
use super::chunking::chunk_by_paragraphs;
use super::client::call_openai;
use super::types::{create_translation_tool, TranslationResult};

async fn translate_chunk(text: &str, source_lang_name: &str, target_lang_name: &str, app: &AppHandle) -> Result<String> {
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

    let tool = create_translation_tool(source_lang_name, target_lang_name);
    let result: TranslationResult = call_openai(system_prompt, text.to_string(), tool, "provide_translation", app).await?;

    Ok(result.translated_text)
}

pub async fn translate_stream(text: &str, source_lang: &str, app: &AppHandle) -> Result<String> {
    println!("[TRANSLATOR] Starting translation...");
    println!("[TRANSLATOR] Source language: {}", source_lang);

    let target_lang = if source_lang == "de" { "en" } else { "de" };
    let source_lang_name = if source_lang == "de" { "German" } else { "English" };
    let target_lang_name = if target_lang == "de" { "German" } else { "English" };

    let chunks = chunk_by_paragraphs(text, 2500);
    let total_chunks = chunks.len();

    if chunks.len() > 1 {
        println!("[TRANSLATOR] Split into {} chunks", chunks.len());
    }

    let mut results = Vec::new();
    for (i, chunk) in chunks.iter().enumerate() {
        if chunks.len() > 1 {
            println!("[TRANSLATOR] Translating chunk {}/{}", i + 1, chunks.len());
        }

        let progress = ((i as f32 / total_chunks as f32) * 100.0) as i32;
        let _ = app.emit("translation-progress", progress);

        let result = translate_chunk(chunk, source_lang_name, target_lang_name, app).await?;
        results.push(result.clone());

        let accumulated = results.join("\n\n");
        let _ = app.emit("translation-chunk", accumulated);

        let progress_after = (((i + 1) as f32 / total_chunks as f32) * 100.0) as i32;
        let _ = app.emit("translation-progress", progress_after);
    }

    let final_result = results.join("\n\n");
    Ok(final_result)
}
