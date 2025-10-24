pub fn estimate_tokens(text: &str) -> usize {
    (text.len() as f32 / 4.0).ceil() as usize
}

pub fn chunk_by_paragraphs(text: &str, max_tokens: usize) -> Vec<String> {
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
