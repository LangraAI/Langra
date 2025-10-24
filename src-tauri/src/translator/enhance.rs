use anyhow::Result;
use tauri::{AppHandle, Emitter};
use super::client::call_openai;
use super::types::{create_correction_tool, create_improvement_tool, CorrectionResult, ImprovementResult};

pub async fn enhance_stream_with_instruction(
    text: &str,
    language: &str,
    instruction: &str,
    app: &AppHandle,
) -> Result<String> {
    println!("[ENHANCE_CUSTOM] Starting text improvement with custom instruction...");
    println!("[ENHANCE_CUSTOM] Language: {}, Instruction: {}", language, instruction);

    let lang_name = if language == "de" { "German" } else { "English" };

    let system_prompt = format!(
        "Apply this improvement to the {} text: {}",
        lang_name, instruction
    );

    let tool = create_improvement_tool(lang_name);
    let result: ImprovementResult = call_openai(system_prompt, text.to_string(), tool, "provide_improved_text", app).await?;

    println!("[ENHANCE_CUSTOM] ✅ Improvement complete");
    Ok(result.improved_text)
}

pub async fn enhance_stream(text: &str, language: &str, app: &AppHandle) -> Result<String> {
    println!("[ENHANCE] Starting text correction...");
    println!("[ENHANCE] Language: {}", language);

    let lang_name = if language == "de" { "German" } else { "English" };

    let system_prompt = format!(
        "Correct any grammar and spelling errors in this {} text:",
        lang_name
    );

    let tool = create_correction_tool(lang_name);
    let result: CorrectionResult = call_openai(system_prompt, text.to_string(), tool, "provide_corrected_text", app).await?;

    println!("[ENHANCE] ✅ Correction complete");
    Ok(result.corrected_text)
}
