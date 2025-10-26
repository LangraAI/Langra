use tauri::{AppHandle, Manager, Emitter};
use tauri::menu::{MenuBuilder, MenuItemBuilder};
use tauri::tray::{TrayIconBuilder, TrayIconEvent};
use crate::windows;
use crate::resize;

pub fn create_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    println!("[TRAY] Creating system tray");

    let show_item = MenuItemBuilder::with_id("show", "Open Langra").build(app)?;
    let quit_item = MenuItemBuilder::with_id("quit", "Quit").build(app)?;

    let menu = MenuBuilder::new(app)
        .item(&show_item)
        .separator()
        .item(&quit_item)
        .build()?;

    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .on_menu_event(|app, event| {
            match event.id.as_ref() {
                "show" => {
                    println!("[TRAY] Show clicked - opening normal window");
                    resize::resize_window_to_normal();
                    windows::show_translator_window(false);
                    let _ = app.emit("switch-to-normal", ());
                }
                "quit" => {
                    println!("[TRAY] Quit clicked");
                    app.exit(0);
                }
                _ => {}
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click { .. } = event {
                println!("[TRAY] Tray icon clicked - opening normal window");
                let app = tray.app_handle();
                resize::resize_window_to_normal();
                windows::show_translator_window(false);
                let _ = app.emit("switch-to-normal", ());
            }
        })
        .build(app)?;

    println!("[TRAY] System tray created successfully");
    Ok(())
}
