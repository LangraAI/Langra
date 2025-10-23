use crate::APP_HANDLE;
use mouse_position::mouse_position::Mouse;
use tauri::{Manager, PhysicalPosition};

pub const TRANSLATOR_WIN_NAME: &str = "main";

pub fn get_mouse_location() -> Result<(i32, i32), String> {
    let position = Mouse::get_mouse_position();
    match position {
        Mouse::Position { x, y } => Ok((x, y)),
        Mouse::Error => Err("Error getting mouse position".to_string()),
    }
}

pub fn get_translator_window(to_mouse_position: bool) -> tauri::WebviewWindow {
    println!("[WINDOW] get_translator_window called");
    let handle = APP_HANDLE.get().unwrap();

    let (window, should_reposition) = match handle.get_webview_window(TRANSLATOR_WIN_NAME) {
        Some(window) => {
            println!("[WINDOW] Window already exists, reusing");
            let was_visible = window.is_visible().unwrap_or(false);
            println!("[WINDOW] Window was visible: {}", was_visible);
            window.unminimize().unwrap();
            (window, !was_visible)
        }
        None => {
            println!("[WINDOW] Creating new window");
            let builder = tauri::WebviewWindowBuilder::new(
                handle,
                TRANSLATOR_WIN_NAME,
                tauri::WebviewUrl::App("index.html".into()),
            )
            .title("Langra")
            .inner_size(600.0, 500.0)
            .min_inner_size(500.0, 400.0)
            .resizable(true)
            .skip_taskbar(false)
            .visible(false)
            .focused(false)
            .decorations(true)
            .transparent(false)
            .always_on_top(true)
            .center();

            let window = build_window(builder);
            println!("[WINDOW] New window built");
            (window, true)
        }
    };

    if to_mouse_position && should_reposition {
        println!("[WINDOW] Repositioning window to mouse cursor");
        let (mouse_x, mouse_y) = get_mouse_location().unwrap_or((100, 100));
        let window_size = window.outer_size().unwrap();

        let mut final_x = mouse_x + 20;
        let mut final_y = mouse_y + 20;

        if let Ok(monitor) = window.current_monitor() {
            if let Some(monitor) = monitor {
                let monitor_size = monitor.size();
                let monitor_pos = monitor.position();

                if final_x + window_size.width as i32 > monitor_pos.x + monitor_size.width as i32 {
                    final_x = mouse_x - window_size.width as i32 - 20;
                }

                if final_y + window_size.height as i32 > monitor_pos.y + monitor_size.height as i32 {
                    final_y = mouse_y - window_size.height as i32 - 20;
                }
            }
        }

        window
            .set_position(PhysicalPosition::new(final_x, final_y))
            .unwrap();
    } else if !should_reposition {
        println!("[WINDOW] Window already visible, keeping current position");
    }

    window
}

pub fn show_translator_window(to_mouse_position: bool) -> tauri::WebviewWindow {
    println!("[WINDOW] show_translator_window called");
    let window = get_translator_window(to_mouse_position);
    println!("[WINDOW] Window created/retrieved");
    window.show().unwrap();
    println!("[WINDOW] Window shown");
    window.set_focus().unwrap();
    println!("[WINDOW] Window focused");
    window
}

#[tauri::command]
pub async fn hide_translator_window() {
    if let Some(handle) = APP_HANDLE.get() {
        match handle.get_webview_window(TRANSLATOR_WIN_NAME) {
            Some(window) => {
                window.hide().unwrap();
            }
            None => {}
        }
    }
}

fn build_window<'a, R: tauri::Runtime, M: tauri::Manager<R>>(
    builder: tauri::WebviewWindowBuilder<'a, R, M>,
) -> tauri::WebviewWindow<R> {
    #[cfg(target_os = "macos")]
    {
        let window = builder
            .title_bar_style(tauri::TitleBarStyle::Overlay)
            .hidden_title(true)
            .build()
            .unwrap();

        post_process_window(&window);

        window
    }

    #[cfg(not(target_os = "macos"))]
    {
        let window = builder.build().unwrap();

        post_process_window(&window);

        window
    }
}

fn post_process_window<R: tauri::Runtime>(window: &tauri::WebviewWindow<R>) {
    window.set_visible_on_all_workspaces(true).unwrap();

    #[cfg(target_os = "macos")]
    {
        use cocoa::appkit::{NSWindow, NSWindowCollectionBehavior};
        use cocoa::base::id;

        let ns_win = window.ns_window().unwrap() as id;

        unsafe {
            let mut collection_behavior = ns_win.collectionBehavior();
            collection_behavior |=
                NSWindowCollectionBehavior::NSWindowCollectionBehaviorCanJoinAllSpaces;

            ns_win.setCollectionBehavior_(collection_behavior);
        }
    }
}
