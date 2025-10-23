use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tauri::AppHandle;

struct KeyboardState {
    cmd_ctrl_pressed: bool,
    c_press_count: u8,
    last_c_press_time: Option<Instant>,
}

pub fn start_listener(app: AppHandle) {
    println!("[KEYBOARD] Starting keyboard listener...");

    let state = Arc::new(Mutex::new(KeyboardState {
        cmd_ctrl_pressed: false,
        c_press_count: 0,
        last_c_press_time: None,
    }));

    #[cfg(target_os = "macos")]
    {
        println!("[KEYBOARD] Starting macOS listener...");
        start_macos_listener(app, state);
    }

    #[cfg(not(target_os = "macos"))]
    {
        println!("[KEYBOARD] Starting rdev listener...");
        start_rdev_listener(app, state);
    }
}

#[cfg(target_os = "macos")]
fn start_macos_listener(app: AppHandle, state: Arc<Mutex<KeyboardState>>) {
    use core_graphics::event::{
        CGEvent, CGEventTap, CGEventTapLocation, CGEventTapOptions, CGEventTapPlacement,
        CGEventTapProxy, CGEventType, EventField,
    };

    std::thread::spawn(move || {
        let events_of_interest = vec![CGEventType::KeyDown, CGEventType::FlagsChanged];

        let state_for_callback = state.clone();
        let app_for_callback = app.clone();

        let callback =
            move |_proxy: CGEventTapProxy,
                  event_type: CGEventType,
                  event: &CGEvent|
                  -> Option<CGEvent> {
                let mut state_lock = state_for_callback.lock().unwrap();

                match event_type {
                    CGEventType::FlagsChanged => {
                        let flags = event.get_flags();
                        let cmd_pressed = flags.contains(
                            core_graphics::event::CGEventFlags::CGEventFlagCommand,
                        );
                        state_lock.cmd_ctrl_pressed = cmd_pressed;
                        if !cmd_pressed {
                            state_lock.c_press_count = 0;
                            state_lock.last_c_press_time = None;
                        }
                    }
                    CGEventType::KeyDown => {
                        let keycode =
                            event.get_integer_value_field(EventField::KEYBOARD_EVENT_KEYCODE);

                        if keycode == 8 && state_lock.cmd_ctrl_pressed {
                            let now = Instant::now();
                            println!("[KEYBOARD] Cmd+C detected, count: {}", state_lock.c_press_count + 1);

                            if let Some(last_time) = state_lock.last_c_press_time {
                                let elapsed = now.duration_since(last_time);

                                if elapsed > Duration::from_millis(500) {
                                    println!("[KEYBOARD] Too slow, resetting count");
                                    state_lock.c_press_count = 1;
                                } else {
                                    state_lock.c_press_count += 1;

                                    if state_lock.c_press_count >= 2 {
                                        println!("[KEYBOARD] Double Cmd+C detected! Triggering translation...");

                                        println!("[KEYBOARD] Remembering active window before translation...");
                                        crate::insertion::remember_active_window();

                                        let app_clone = app_for_callback.clone();
                                        std::thread::spawn(move || {
                                            tauri::async_runtime::block_on(async {
                                                crate::trigger_translation(&app_clone).await;
                                            });
                                        });
                                        state_lock.c_press_count = 0;
                                        state_lock.last_c_press_time = None;
                                        return None;
                                    }
                                }
                            } else {
                                state_lock.c_press_count = 1;
                            }

                            state_lock.last_c_press_time = Some(now);
                        }
                    }
                    _ => {}
                }

                None
            };

        let tap = CGEventTap::new(
            CGEventTapLocation::HID,
            CGEventTapPlacement::HeadInsertEventTap,
            CGEventTapOptions::ListenOnly,
            events_of_interest,
            callback,
        );

        match tap {
            Ok(tap) => unsafe {
                use core_foundation::runloop::{kCFRunLoopCommonModes, CFRunLoop};

                let loop_source = tap
                    .mach_port
                    .create_runloop_source(0)
                    .expect("Failed to create runloop source");
                let current_loop = CFRunLoop::get_current();
                current_loop.add_source(&loop_source, kCFRunLoopCommonModes);

                tap.enable();
                CFRunLoop::run_current();
            },
            Err(e) => {
                eprintln!("Failed to create event tap: {:?}", e);
            }
        }
    });
}

#[cfg(not(target_os = "macos"))]
fn start_rdev_listener(app: AppHandle, state: Arc<Mutex<KeyboardState>>) {
    use rdev::{listen, Event, EventType, Key};

    std::thread::spawn(move || {
        let callback = move |event: Event| {
            let mut state_lock = state.lock().unwrap();

            match event.event_type {
                EventType::KeyPress(Key::ControlLeft) | EventType::KeyPress(Key::ControlRight) => {
                    state_lock.cmd_ctrl_pressed = true;
                }
                EventType::KeyRelease(Key::ControlLeft)
                | EventType::KeyRelease(Key::ControlRight) => {
                    state_lock.cmd_ctrl_pressed = false;
                    state_lock.c_press_count = 0;
                    state_lock.last_c_press_time = None;
                }
                EventType::KeyPress(Key::KeyC) => {
                    if state_lock.cmd_ctrl_pressed {
                        let now = Instant::now();

                        if let Some(last_time) = state_lock.last_c_press_time {
                            let elapsed = now.duration_since(last_time);

                            if elapsed > Duration::from_millis(500) {
                                state_lock.c_press_count = 1;
                            } else {
                                state_lock.c_press_count += 1;

                                if state_lock.c_press_count >= 2 {
                                    crate::insertion::remember_active_window();

                                    let app_clone = app.clone();
                                    std::thread::spawn(move || {
                                        tauri::async_runtime::block_on(async {
                                            crate::trigger_translation(&app_clone).await;
                                        });
                                    });
                                    state_lock.c_press_count = 0;
                                    state_lock.last_c_press_time = None;
                                }
                            }
                        } else {
                            state_lock.c_press_count = 1;
                        }

                        state_lock.last_c_press_time = Some(now);
                    }
                }
                _ => {}
            }
        };

        if let Err(error) = listen(callback) {
            eprintln!("Error listening to keyboard events: {:?}", error);
        }
    });
}
