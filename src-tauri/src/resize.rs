use tauri::{LogicalSize, Manager};
use crate::windows::TRANSLATOR_WIN_NAME;
use crate::APP_HANDLE;

#[tauri::command]
pub fn resize_window_to_normal() {
    println!("[RESIZE] Resizing to normal mode (1000x800)");
    if let Some(handle) = APP_HANDLE.get() {
        if let Some(window) = handle.get_webview_window(TRANSLATOR_WIN_NAME) {
            let _ = window.set_size(LogicalSize::new(1000.0, 800.0));
            let _ = window.set_min_size(Some(LogicalSize::new(900.0, 700.0)));
            let _ = window.center();
        }
    }
}

#[tauri::command]
pub fn resize_window_to_popup() {
    println!("[RESIZE] Resizing to popup mode (420x280)");
    if let Some(handle) = APP_HANDLE.get() {
        if let Some(window) = handle.get_webview_window(TRANSLATOR_WIN_NAME) {
            let _ = window.set_size(LogicalSize::new(420.0, 280.0));
            let _ = window.set_min_size(Some(LogicalSize::new(400.0, 260.0)));
        }
    }
}
