use serde::{Deserialize, Serialize};

#[derive(Serialize)]
pub struct AzureRequest {
    pub messages: Vec<Message>,
    pub max_tokens: i32,
    pub temperature: f32,
    pub stream: bool,
    pub tools: Vec<Tool>,
    pub tool_choice: serde_json::Value,
}

#[derive(Serialize, Deserialize)]
pub struct Message {
    pub role: String,
    pub content: String,
}

#[derive(Serialize)]
pub struct Tool {
    #[serde(rename = "type")]
    pub tool_type: String,
    pub function: Function,
}

#[derive(Serialize)]
pub struct Function {
    pub name: String,
    pub description: String,
    pub parameters: FunctionParameters,
}

#[derive(Serialize)]
pub struct FunctionParameters {
    #[serde(rename = "type")]
    pub param_type: String,
    pub properties: serde_json::Value,
    pub required: Vec<String>,
}

#[derive(Deserialize)]
pub struct StreamResponse {
    pub choices: Vec<StreamChoice>,
}

#[derive(Deserialize)]
pub struct StreamChoice {
    pub delta: Delta,
}

#[derive(Deserialize)]
pub struct Delta {
    pub tool_calls: Option<Vec<ToolCallDelta>>,
}

#[derive(Deserialize)]
pub struct ToolCallDelta {
    pub function: Option<FunctionDelta>,
}

#[derive(Deserialize)]
pub struct FunctionDelta {
    pub arguments: Option<String>,
}

#[derive(Deserialize)]
pub struct TranslationResult {
    pub translated_text: String,
}

#[derive(Deserialize)]
pub struct CorrectionResult {
    pub corrected_text: String,
}

#[derive(Deserialize)]
pub struct ImprovementResult {
    pub improved_text: String,
}

pub fn create_translation_tool(source_lang_name: &str, target_lang_name: &str) -> Tool {
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

pub fn create_correction_tool(lang_name: &str) -> Tool {
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

pub fn create_improvement_tool(lang_name: &str) -> Tool {
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
