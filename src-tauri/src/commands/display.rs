use tauri::{command, AppHandle, Manager, Runtime, WebviewWindowBuilder};
use std::collections::HashMap;
use std::sync::Mutex;
use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct MonitorInfo {
    pub index: usize,
    pub name: String,
    pub width: u32,
    pub height: u32,
    pub x: i32,
    pub y: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowInstance {
    pub id: String,
    pub monitor_index: usize,
    pub x: i32,
    pub y: i32,
    pub is_primary: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowPosition {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

// 存储窗口实例的全局状态 - 使用显示器索引作为键
lazy_static! {
    static ref WINDOW_INSTANCES: Mutex<HashMap<usize, WindowInstance>> = Mutex::new(HashMap::new());
    static ref SAVED_POSITIONS: Mutex<HashMap<usize, WindowPosition>> = Mutex::new(HashMap::new());
}

fn get_window_instances() -> std::sync::MutexGuard<'static, HashMap<usize, WindowInstance>> {
    WINDOW_INSTANCES.lock().unwrap()
}

fn get_saved_positions() -> std::sync::MutexGuard<'static, HashMap<usize, WindowPosition>> {
    SAVED_POSITIONS.lock().unwrap()
}

// 生成清晰的窗口ID
fn generate_window_id(monitor_index: usize, is_primary: bool) -> String {
    if is_primary {
        format!("main_monitor_{}", monitor_index)
    } else {
        format!("secondary_monitor_{}", monitor_index)
    }
}

// 保存窗口位置
fn save_window_position(monitor_index: usize, x: i32, y: i32, width: u32, height: u32) {
    let position = WindowPosition { x, y, width, height };
    get_saved_positions().insert(monitor_index, position);
}

// 获取保存的窗口位置，如果没有则返回默认居中位置
fn get_window_position(monitor_index: usize, monitor_pos: &tauri::PhysicalPosition<i32>, monitor_size: &tauri::PhysicalSize<u32>) -> (i32, i32) {
    if let Some(saved_pos) = get_saved_positions().get(&monitor_index) {
        // 验证保存的位置是否仍在显示器范围内
        let in_bounds_x = saved_pos.x >= monitor_pos.x && saved_pos.x <= monitor_pos.x + monitor_size.width as i32;
        let in_bounds_y = saved_pos.y >= monitor_pos.y && saved_pos.y <= monitor_pos.y + monitor_size.height as i32;
        
        if in_bounds_x && in_bounds_y {
            return (saved_pos.x, saved_pos.y);
        }
    }
    
    // 默认居中位置
    let window_width = 400;
    let window_height = 400;
    let x = monitor_pos.x + (monitor_size.width as i32 - window_width) / 2;
    let y = monitor_pos.y + (monitor_size.height as i32 - window_height) / 2;
    (x, y)
}

#[command]
pub async fn create_window_on_monitor<R: Runtime>(
    app_handle: AppHandle<R>,
    monitor_index: usize,
    is_primary: Option<bool>,
) -> Result<String, String> {
    let is_primary = is_primary.unwrap_or(false);
    let window_id = generate_window_id(monitor_index, is_primary);
    
    println!("准备创建新窗口: 显示器索引 = {}, 窗口ID = {}, 主窗口 = {}", monitor_index, window_id, is_primary);
    
    // 检查是否已存在该显示器的窗口
    if let Some(existing) = get_window_instances().get(&monitor_index) {
        if app_handle.get_webview_window(&existing.id).is_some() {
            println!("显示器 {} 上已存在窗口: {}", monitor_index, existing.id);
            return Ok(existing.id.clone());
        } else {
            // 窗口已不存在，清理状态
            get_window_instances().remove(&monitor_index);
        }
    }
    
    // 如果存在旧的窗口ID格式，清理它们
    let old_window_ids = vec![
        format!("monitor_{}", monitor_index),
        format!("main_monitor_{}", monitor_index),
        format!("secondary_monitor_{}", monitor_index)
    ];
    
    for old_id in &old_window_ids {
        if let Some(window) = app_handle.get_webview_window(old_id) {
            println!("关闭旧格式窗口: {}", old_id);
            let _ = window.close();
        }
    }
    
    // 旧的清理逻辑已移除，使用上面的精确ID匹配
    
    // 获取显示器信息
    let monitors = app_handle.available_monitors()
        .map_err(|e| {
            let err_msg = format!("获取显示器信息失败: {}", e);
            println!("错误: {}", err_msg);
            err_msg
        })?;
    
    if monitor_index >= monitors.len() {
        let err_msg = format!("显示器索引超出范围: 请求索引 {} 但只有 {} 个显示器", 
                             monitor_index, monitors.len());
        println!("错误: {}", err_msg);
        return Err(err_msg);
    }
    
    let monitor = &monitors[monitor_index];
    let monitor_pos = monitor.position();
    let monitor_size = monitor.size();
    
    println!("准备在显示器 {} 上创建窗口: 位置({}, {}), 尺寸({}x{})", 
             monitor_index, monitor_pos.x, monitor_pos.y, 
             monitor_size.width, monitor_size.height);
    
    // 使用新的位置管理系统获取窗口位置
    let (x, y) = get_window_position(monitor_index, &monitor_pos, &monitor_size);
    let window_width = 400;
    let window_height = 400;
    
    // 检查窗口ID是否已经存在
    if app_handle.get_webview_window(&window_id).is_some() {
        let err_msg = format!("窗口ID {} 已存在，这不应该发生", window_id);
        println!("错误: {}", err_msg);
        return Err(err_msg);
    }
    
    println!("开始创建新窗口 {} 在位置 ({}, {})", window_id, x, y);
    
    // 简化窗口创建过程，减少重试逻辑的复杂性
    match WebviewWindowBuilder::new(
        &app_handle,
        &window_id,
        tauri::WebviewUrl::App("index.html/#/".into())
    )
    .title("BongoCat")
    .inner_size(window_width as f64, window_height as f64)
    .min_inner_size(200.0, 200.0)
    .max_inner_size(800.0, 800.0)
    .position(x as f64, y as f64)
    .shadow(false)
    .always_on_top(true)
    .transparent(true)
    .decorations(false)
    .accept_first_mouse(true)
    .skip_taskbar(true)
    .resizable(true)
    .build() {
        Ok(window) => {
            println!("窗口 {} 创建成功", window_id);
            
            // 确保窗口可见
            if let Err(e) = window.show() {
                println!("警告: 显示窗口失败: {}", e);
            }
            
            // 尝试将窗口置于前台
            if let Err(e) = window.set_focus() {
                println!("警告: 聚焦窗口失败: {}", e);
            }
        },
        Err(e) => {
            let error_message = format!("创建窗口失败: {}", e);
            println!("错误: {}", error_message);
            return Err(error_message);
        }
    }
    
    // 存储窗口实例信息
    let instance = WindowInstance {
        id: window_id.clone(),
        monitor_index,
        x,
        y,
        is_primary,
    };
    
    println!("窗口创建成功并记录: 显示器 = {}, 窗口ID = {}", monitor_index, window_id);
    
    // 使用显示器索引作为键存储窗口实例
    get_window_instances().insert(monitor_index, instance);
    
    // 保存窗口位置
    save_window_position(monitor_index, x, y, window_width as u32, window_height as u32);
    
    // 返回创建的窗口ID
    Ok(window_id)
}

#[command]
pub async fn close_window_instance<R: Runtime>(
    app_handle: AppHandle<R>,
    window_id: String,
) -> Result<(), String> {
    println!("尝试关闭窗口实例: {}", window_id);
    
    // 查找并移除窗口实例
    let monitor_index = {
        let instances = get_window_instances();
        instances.iter()
            .find(|(_, instance)| instance.id == window_id)
            .map(|(index, _)| *index)
    };
    
    if let Some(index) = monitor_index {
        get_window_instances().remove(&index);
        println!("已从显示器 {} 移除窗口实例", index);
    }
    
    // 关闭窗口
    if let Some(window) = app_handle.get_webview_window(&window_id) {
        if let Err(e) = window.close() {
            let err_msg = format!("关闭窗口失败: {}", e);
            println!("警告: {}", err_msg);
        }
    } else {
        println!("窗口实例 {} 不存在或已关闭", window_id);
    }
    
    Ok(())
}

#[command]
pub async fn move_main_window_to_monitor<R: Runtime>(
    app_handle: AppHandle<R>,
    monitor_index: usize,
) -> Result<(), String> {
    println!("准备设置主窗口到显示器 {}", monitor_index);
    
    // 获取主窗口
    let main_window = app_handle.get_webview_window("main")
        .ok_or_else(|| "找不到主窗口".to_string())?;
    
    // 获取显示器信息
    let monitors = app_handle.available_monitors()
        .map_err(|e| format!("获取显示器信息失败: {}", e))?;
    
    if monitor_index >= monitors.len() {
        return Err(format!("显示器索引超出范围: 请求索引 {} 但只有 {} 个显示器", 
                          monitor_index, monitors.len()));
    }
    
    // 保持主窗口当前位置，不进行移动
    // 只确保窗口可见并获得焦点
    let _ = main_window.show();
    let _ = main_window.set_focus();
    
    println!("主窗口已设置到显示器 {}，保持当前位置不变", monitor_index);
    Ok(())
}

// 新增：按显示器索引关闭窗口
#[command]
pub async fn close_window_on_monitor<R: Runtime>(
    app_handle: AppHandle<R>,
    monitor_index: usize,
) -> Result<(), String> {
    println!("尝试关闭显示器 {} 上的窗口", monitor_index);
    
    if let Some(instance) = get_window_instances().remove(&monitor_index) {
        if let Some(window) = app_handle.get_webview_window(&instance.id) {
            if let Err(e) = window.close() {
                println!("警告: 关闭窗口失败: {}", e);
            }
        }
        println!("已关闭显示器 {} 上的窗口: {}", monitor_index, instance.id);
    } else {
        println!("显示器 {} 上没有窗口", monitor_index);
    }
    
    Ok(())
}

#[command]
pub async fn reset_window_positions<R: Runtime>(
    app_handle: AppHandle<R>,
) -> Result<(), String> {
    println!("开始重置多屏显示窗口");
    
    // 清空所有窗口实例记录和保存的位置
    get_window_instances().clear();
    get_saved_positions().clear();
    
    // 保持主窗口当前位置，不进行重置
    if let Some(main_window) = app_handle.get_webview_window("main") {
        // 只确保主窗口可见，不改变位置
        let _ = main_window.show();
        let _ = main_window.set_focus();
        println!("主窗口保持当前位置不变");
    }
    
    // 关闭所有多屏显示创建的窗口实例
    println!("正在关闭所有多屏显示窗口");
    
    // 收集所有要关闭的窗口名称（包括新旧命名格式）
    let multi_screen_windows: Vec<String> = app_handle.webview_windows().iter()
        .map(|w| w.0.clone())
        .filter(|id| id.starts_with("monitor_") || id.starts_with("main_monitor_") || id.starts_with("secondary_monitor_"))
        .collect();
        
    println!("找到 {} 个多屏显示窗口需要关闭", multi_screen_windows.len());
    
    // 逐个关闭窗口
    for name in multi_screen_windows {
        println!("正在关闭窗口实例: {}", name);
        if let Some(window) = app_handle.get_webview_window(&name) {
            if let Err(e) = window.close() {
                println!("警告: 关闭窗口 {} 失败: {}", name, e);
            }
        }
    }
    
    println!("窗口位置重置完成");
    Ok(())
}

#[command]
pub async fn list_window_instances() -> Result<Vec<WindowInstance>, String> {
    Ok(get_window_instances().values().cloned().collect())
}

#[command]
pub async fn get_available_monitors<R: Runtime>(
    app_handle: AppHandle<R>,
) -> Result<Vec<MonitorInfo>, String> {
    let monitors = app_handle.available_monitors()
        .map_err(|e| format!("获取显示器信息失败: {}", e))?;
    
    let monitor_info: Vec<MonitorInfo> = monitors
        .into_iter()
        .enumerate()
        .map(|(index, monitor)| {
            let pos = monitor.position();
            let size = monitor.size();
            MonitorInfo {
                index,
                name: monitor.name().map_or_else(|| format!("显示器 {}", index + 1), |s| s.to_string()),
                width: size.width,
                height: size.height,
                x: pos.x,
                y: pos.y,
            }
        })
        .collect();
    
    Ok(monitor_info)
}