use tauri::{AppHandle, WebviewWindow};

#[cfg(target_os = "macos")]
mod macos;

#[cfg(target_os = "windows")]
mod windows;

#[cfg(target_os = "linux")]
mod linux;

#[cfg(target_os = "macos")]
pub use macos::*;

#[cfg(target_os = "windows")]
pub use windows::*;

#[cfg(target_os = "linux")]
pub use linux::*;

pub fn default(
    app_handle: &AppHandle,
    main_window: WebviewWindow,
    preference_window: WebviewWindow,
) {
    #[cfg(any(dev, debug_assertions))]
    main_window.open_devtools();
    
    // 在启动时确保主窗口位于主显示器上
    if let Ok(monitors) = app_handle.available_monitors() {
        if !monitors.is_empty() {
            let primary_monitor = &monitors[0];
            let monitor_pos = primary_monitor.position();
            let monitor_size = primary_monitor.size();
            
            // 计算居中位置
            let window_width = 400;
            let window_height = 400;
            let x = monitor_pos.x + (monitor_size.width as i32 - window_width) / 2;
            let y = monitor_pos.y + (monitor_size.height as i32 - window_height) / 2;
            
            println!("应用启动: 将主窗口放置在主显示器 ({}, {})", x, y);
            
            // 设置主窗口位置并确保可见
            if let Err(e) = main_window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x, y })) {
                eprintln!("设置主窗口位置失败: {}", e);
            }
            
            // 确保窗口可见
            if let Err(e) = main_window.show() {
                eprintln!("显示主窗口失败: {}", e);
            }
        }
    }

    platform(app_handle, main_window.clone(), preference_window.clone());
}
