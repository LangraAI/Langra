use enigo::*;
use parking_lot::Mutex;
use std::{thread, time::Duration};
#[cfg(target_os = "macos")]
use tauri::path::BaseDirectory;
use tauri::{Emitter, Manager};

use crate::APP_HANDLE;

static COPY_PASTE: Mutex<()> = Mutex::new(());

#[cfg(not(target_os = "macos"))]
fn up_control_keys(enigo: &mut Enigo) {
    enigo.key(Key::Control, Direction::Release).unwrap();
    enigo.key(Key::Alt, Direction::Release).unwrap();
    enigo.key(Key::Shift, Direction::Release).unwrap();
}

#[cfg(target_os = "macos")]
fn up_control_keys(enigo: &mut Enigo) {
    enigo.key(Key::Control, Direction::Release).unwrap();
    enigo.key(Key::Meta, Direction::Release).unwrap();
    enigo.key(Key::Alt, Direction::Release).unwrap();
    enigo.key(Key::Shift, Direction::Release).unwrap();
    enigo.key(Key::Option, Direction::Release).unwrap();
}

#[cfg(not(target_os = "macos"))]
pub fn copy(enigo: &mut Enigo) {
    let _guard = COPY_PASTE.lock();

    up_control_keys(enigo);

    enigo.key(Key::Control, Direction::Press).unwrap();
    #[cfg(target_os = "windows")]
    enigo.key(Key::C, Direction::Click).unwrap();
    #[cfg(target_os = "linux")]
    enigo.key(Key::Unicode('c'), Direction::Click).unwrap();
    enigo.key(Key::Control, Direction::Release).unwrap();
}

#[cfg(target_os = "macos")]
pub fn copy(_enigo: &mut Enigo) {
    let _guard = COPY_PASTE.lock();

    let apple_script = APP_HANDLE
        .get()
        .unwrap()
        .path()
        .resolve("resources/copy.applescript", BaseDirectory::Resource)
        .expect("failed to resolve copy.applescript");

    std::process::Command::new("osascript")
        .arg(apple_script)
        .spawn()
        .expect("failed to run applescript")
        .wait()
        .expect("failed to wait");
}

#[cfg(not(target_os = "macos"))]
pub fn paste(enigo: &mut Enigo) {
    let _guard = COPY_PASTE.lock();

    up_control_keys(enigo);

    enigo.key(Key::Control, Direction::Press).unwrap();
    #[cfg(target_os = "windows")]
    enigo.key(Key::V, Direction::Click).unwrap();
    #[cfg(target_os = "linux")]
    enigo.key(Key::Unicode('v'), Direction::Click).unwrap();
    enigo.key(Key::Control, Direction::Release).unwrap();
}

#[cfg(target_os = "macos")]
pub fn paste(_enigo: &mut Enigo) {
    let _guard = COPY_PASTE.lock();

    let apple_script = APP_HANDLE
        .get()
        .unwrap()
        .path()
        .resolve("resources/paste.applescript", BaseDirectory::Resource)
        .expect("failed to resolve paste.applescript");

    std::process::Command::new("osascript")
        .arg(apple_script)
        .spawn()
        .expect("failed to run applescript")
        .wait()
        .expect("failed to wait");
}

pub fn get_selected_text_by_clipboard(
    enigo: &mut Enigo,
) -> Result<String, Box<dyn std::error::Error>> {
    use arboard::Clipboard;

    let old_clipboard = (Clipboard::new()?.get_text(), Clipboard::new()?.get_image());

    let mut write_clipboard = Clipboard::new()?;

    let not_selected_placeholder = "";

    write_clipboard.set_text(not_selected_placeholder)?;

    thread::sleep(Duration::from_millis(50));

    copy(enigo);

    thread::sleep(Duration::from_millis(100));

    let new_text = Clipboard::new()?.get_text();

    match old_clipboard {
        (Ok(old_text), _) => {
            write_clipboard.set_text(old_text.clone())?;
            if let Ok(new) = new_text {
                if new.trim() == not_selected_placeholder.trim() {
                    Ok(String::new())
                } else {
                    Ok(new)
                }
            } else {
                Ok(String::new())
            }
        }
        (_, Ok(image)) => {
            write_clipboard.set_image(image)?;
            if let Ok(new) = new_text {
                if new.trim() == not_selected_placeholder.trim() {
                    Ok(String::new())
                } else {
                    Ok(new)
                }
            } else {
                Ok(String::new())
            }
        }
        _ => {
            write_clipboard.clear()?;
            if let Ok(new) = new_text {
                if new.trim() == not_selected_placeholder.trim() {
                    Ok(String::new())
                } else {
                    Ok(new)
                }
            } else {
                Ok(String::new())
            }
        }
    }
}

pub fn send_text(text: String) {
    match APP_HANDLE.get() {
        Some(handle) => handle.emit("change-text", text).unwrap_or_default(),
        None => {}
    }
}
