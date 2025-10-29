use active_win_pos_rs::{get_active_window, ActiveWindow};
use parking_lot::Mutex;
use std::thread;
use std::time::Duration;

static PREVIOUS_ACTIVE_WINDOW: Mutex<Option<ActiveWindow>> = Mutex::new(None);

fn is_translator_process(window: &ActiveWindow) -> bool {
    window.process_id == std::process::id() as u64
}

pub fn remember_active_window() {
    println!("[INSERTION] Attempting to remember active window...");
    match get_active_window() {
        Ok(window) => {
            println!("[INSERTION] Got active window: app='{}', process_id={}", window.app_name, window.process_id);
            if is_translator_process(&window) {
                println!("[INSERTION] ⚠️ Active window is translator itself, not saving");
            } else {
                println!("[INSERTION] ✅ Saved previous window: '{}'", window.app_name);
                *PREVIOUS_ACTIVE_WINDOW.lock() = Some(window);
            }
        }
        Err(e) => {
            println!("[INSERTION] ❌ Failed to get active window: {:?}", e);
        }
    }
}

#[cfg(target_os = "macos")]
fn focus_window(window: &ActiveWindow) -> Result<(), String> {
    use cocoa::appkit::{NSApplicationActivateIgnoringOtherApps, NSRunningApplication};
    #[cfg(not(target_arch = "aarch64"))]
    use cocoa::base::NO;
    use cocoa::base::{id, nil};

    unsafe {
        let running_app: id = <id as NSRunningApplication>::runningApplicationWithProcessIdentifier(
            nil,
            window.process_id as i32,
        );
        if running_app != nil {
            let activated_raw = NSRunningApplication::activateWithOptions_(
                running_app,
                NSApplicationActivateIgnoringOtherApps,
            );
            let activated = {
                #[cfg(target_arch = "aarch64")]
                {
                    activated_raw
                }
                #[cfg(not(target_arch = "aarch64"))]
                {
                    activated_raw != NO
                }
            };
            if activated {
                return Ok(());
            }
        }
    }

    if window.app_name.is_empty() {
        return Err("previous window app name is empty".to_string());
    }
    let script = format!(
        r#"tell application "{}" to activate"#,
        window.app_name.replace('"', "\\\"")
    );
    let status = std::process::Command::new("osascript")
        .arg("-e")
        .arg(&script)
        .status()
        .map_err(|e| e.to_string())?;
    if status.success() {
        Ok(())
    } else {
        Err(format!("failed to focus app {}", window.app_name))
    }
}

#[cfg(target_os = "windows")]
fn focus_window(window: &ActiveWindow) -> Result<(), String> {
    use windows::Win32::Foundation::HWND;
    use windows::Win32::System::Threading::{AttachThreadInput, GetCurrentThreadId};
    use windows::Win32::UI::WindowsAndMessaging::{
        BringWindowToTop, GetForegroundWindow, GetWindowThreadProcessId, IsIconic,
        SetForegroundWindow, ShowWindow, SW_RESTORE,
    };

    let hwnd = parse_hwnd(&window.window_id)?;

    unsafe {
        if IsIconic(hwnd).as_bool() {
            ShowWindow(hwnd, SW_RESTORE);
        }
        let fg_window: HWND = GetForegroundWindow();
        let target_thread_id = GetWindowThreadProcessId(hwnd, None);
        let foreground_thread_id = GetWindowThreadProcessId(fg_window, None);
        let current_thread_id = GetCurrentThreadId();

        if target_thread_id == 0 {
            return Err("failed to get target thread id".to_string());
        }

        AttachThreadInput(foreground_thread_id, current_thread_id, true);
        AttachThreadInput(target_thread_id, current_thread_id, true);

        BringWindowToTop(hwnd);
        let success = SetForegroundWindow(hwnd);

        AttachThreadInput(foreground_thread_id, current_thread_id, false);
        AttachThreadInput(target_thread_id, current_thread_id, false);

        if success.as_bool() {
            Ok(())
        } else {
            Err("SetForegroundWindow failed".to_string())
        }
    }
}

#[cfg(target_os = "windows")]
fn parse_hwnd(window_id: &str) -> Result<windows::Win32::Foundation::HWND, String> {
    use std::ffi::c_void;
    use windows::Win32::Foundation::HWND;

    let trimmed = window_id.trim();
    let hex_str = trimmed
        .strip_prefix("HWND(")
        .and_then(|s| s.strip_suffix(')'))
        .ok_or_else(|| format!("invalid window id format: {}", window_id))?
        .trim_start_matches("0x");
    let value = usize::from_str_radix(hex_str, 16)
        .map_err(|_| format!("failed to parse window id {}", window_id))?;
    Ok(HWND(value as *mut c_void))
}

#[cfg(target_os = "linux")]
fn focus_window(window: &ActiveWindow) -> Result<(), String> {
    use xcb::x;
    use xcb::XidNew;

    let window_id: u32 = window
        .window_id
        .parse()
        .map_err(|_| format!("invalid window id {}", window.window_id))?;

    let (conn, screen_num) = xcb::Connection::connect(None).map_err(|e| e.to_string())?;
    let setup = conn.get_setup();
    let screen = setup
        .roots()
        .nth(screen_num as usize)
        .ok_or_else(|| "failed to get screen".to_string())?;
    let root = screen.root();

    let atom = |name: &str| -> Result<x::Atom, String> {
        let cookie = conn.send_request(&x::InternAtom {
            only_if_exists: false,
            name: name.as_bytes(),
        });
        conn.wait_for_reply(cookie)
            .map(|reply| reply.atom())
            .map_err(|e| e.to_string())
    };

    let net_active_window = atom("_NET_ACTIVE_WINDOW")?;

    let data = x::ClientMessageData::Data32([1, x::CURRENT_TIME, window_id, 0, 0]);
    let window = unsafe { x::Window::new(window_id) };
    let event = x::ClientMessageEvent::new(window, net_active_window, data);

    conn.send_request(&x::SendEvent {
        propagate: false,
        destination: x::SendEventDest::Window(root),
        event: &event,
        event_mask: x::EventMask::SUBSTRUCTURE_REDIRECT | x::EventMask::SUBSTRUCTURE_NOTIFY,
    });
    conn.flush().map_err(|e| e.to_string())?;

    Ok(())
}

fn focus_previous_window() -> Result<(), String> {
    println!("[INSERTION] Checking for previous window...");
    if let Some(window) = PREVIOUS_ACTIVE_WINDOW.lock().clone() {
        println!("[INSERTION] Found previous window: '{}'", window.app_name);
        let result = focus_window(&window);
        result
    } else {
        println!("[INSERTION] No previous window in memory");
        Err("no previous window recorded".to_string())
    }
}

/// Instant paste using platform-specific APIs (no delays)
#[cfg(target_os = "macos")]
fn instant_paste_command() -> Result<(), String> {
    use core_graphics::event::{CGEvent, CGEventFlags, CGEventTapLocation};
    use core_graphics::event_source::{CGEventSource, CGEventSourceStateID};

    println!("[INSERTION] Instant paste via CGEvent");

    let source = CGEventSource::new(CGEventSourceStateID::CombinedSessionState)
        .map_err(|_| "Failed to create CGEventSource")?;

    let v_down = CGEvent::new_keyboard_event(source.clone(), 9, true)
        .map_err(|_| "Failed to create key down event")?;
    v_down.set_flags(CGEventFlags::CGEventFlagCommand);
    v_down.post(CGEventTapLocation::HID);

    let v_up = CGEvent::new_keyboard_event(source, 9, false)
        .map_err(|_| "Failed to create key up event")?;
    v_up.post(CGEventTapLocation::HID);

    Ok(())
}

#[cfg(target_os = "windows")]
fn instant_paste_command() -> Result<(), String> {
    use windows::Win32::UI::Input::KeyboardAndMouse::{
        SendInput, INPUT, INPUT_KEYBOARD, KEYBDINPUT, KEYEVENTF_KEYUP,
        VK_CONTROL, VK_V,
    };

    println!("[INSERTION] Instant paste via SendInput");

    let mut inputs: [INPUT; 4] = unsafe { std::mem::zeroed() };

    inputs[0].r#type = INPUT_KEYBOARD;
    inputs[0].Anonymous.ki = KEYBDINPUT {
        wVk: VK_CONTROL,
        wScan: 0,
        dwFlags: Default::default(),
        time: 0,
        dwExtraInfo: 0,
    };

    inputs[1].r#type = INPUT_KEYBOARD;
    inputs[1].Anonymous.ki = KEYBDINPUT {
        wVk: VK_V,
        wScan: 0,
        dwFlags: Default::default(),
        time: 0,
        dwExtraInfo: 0,
    };

    inputs[2].r#type = INPUT_KEYBOARD;
    inputs[2].Anonymous.ki = KEYBDINPUT {
        wVk: VK_V,
        wScan: 0,
        dwFlags: KEYEVENTF_KEYUP,
        time: 0,
        dwExtraInfo: 0,
    };

    inputs[3].r#type = INPUT_KEYBOARD;
    inputs[3].Anonymous.ki = KEYBDINPUT {
        wVk: VK_CONTROL,
        wScan: 0,
        dwFlags: KEYEVENTF_KEYUP,
        time: 0,
        dwExtraInfo: 0,
    };

    unsafe {
        let result = SendInput(&inputs, std::mem::size_of::<INPUT>() as i32);
        if result != 4 {
            return Err(format!("SendInput sent only {} of 4 events", result));
        }
    }

    Ok(())
}

#[cfg(target_os = "linux")]
fn instant_paste_command() -> Result<(), String> {
    use enigo::{Enigo, Key, Direction, Keyboard, Settings};

    println!("[INSERTION] Instant paste via enigo");

    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    enigo.key(Key::Control, Direction::Press).map_err(|e| e.to_string())?;
    enigo.key(Key::Unicode('v'), Direction::Click).map_err(|e| e.to_string())?;
    enigo.key(Key::Control, Direction::Release).map_err(|e| e.to_string())?;

    Ok(())
}

fn replace_input_with_text(text: &str) -> Result<(), String> {
    if text.is_empty() {
        return Ok(());
    }

    use arboard::Clipboard;

    let mut clipboard = Clipboard::new().map_err(|e| e.to_string())?;
    clipboard.set_text(text).map_err(|e| e.to_string())?;

    println!("[INSERTION] Text in clipboard, ready to paste");

    thread::sleep(Duration::from_millis(50));

    instant_paste_command()?;
    println!("[INSERTION] ✅ Paste complete");

    Ok(())
}

#[tauri::command]
pub async fn insert_translation_into_previous_input(text: String) -> Result<(), String> {
    println!("[INSERTION] Starting replace with text: '{}'", text);

    println!("[INSERTION] Focusing previous window...");
    match focus_previous_window() {
        Ok(_) => println!("[INSERTION] ✅ Window focused successfully"),
        Err(e) => {
            println!("[INSERTION] ❌ Failed to focus window: {}", e);
            return Err(e);
        }
    }

    println!("[INSERTION] Waiting 100ms for window focus...");
    thread::sleep(Duration::from_millis(100));

    println!("[INSERTION] Replacing input with text...");
    match replace_input_with_text(&text) {
        Ok(_) => {
            println!("[INSERTION] ✅ Text inserted successfully");
            Ok(())
        }
        Err(e) => {
            println!("[INSERTION] ❌ Failed to insert text: {}", e);
            Err(e)
        }
    }
}
