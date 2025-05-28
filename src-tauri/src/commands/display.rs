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
}

// 存储窗口实例的全局状态
lazy_static! {
    static ref WINDOW_INSTANCES: Mutex<HashMap<String, WindowInstance>> = Mutex::new(HashMap::new());
}

fn get_window_instances() -> std::sync::MutexGuard<'static, HashMap<String, WindowInstance>> {
    WINDOW_INSTANCES.lock().unwrap()
}

#[command]
pub async fn create_window_on_monitor<R: Runtime>(
    app_handle: AppHandle<R>,
    monitor_index: usize,
) -> Result<String, String> {
    // 为每个显示器创建唯一ID，使用时间戳确保唯一性
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
        
    let window_id = format!("monitor_{}_{}", monitor_index, timestamp);
    
    println!("准备创建新窗口: 显示器索引 = {}, 窗口ID = {}", monitor_index, window_id);
    
    // 先清除这个显示器上的状态记录
    let storage_key = format!("monitor_{}", monitor_index);
    get_window_instances().remove(&storage_key);
    
    // 关闭所有可能存在的相关窗口
    let prefix = format!("monitor_{}_", monitor_index);
    
    // 获取所有包含监视器索引的窗口的ID
    for name in app_handle.webview_windows().iter()
        .map(|w| w.0.clone())
        .filter(|id| id.starts_with(&prefix))
        .collect::<Vec<String>>() {
            
        println!("正在关闭显示器 {} 上的现有窗口: {}", monitor_index, name);
        if let Some(window) = app_handle.get_webview_window(&name) {
            if let Err(e) = window.close() {
                println!("警告: 关闭窗口 {} 失败: {}", name, e);
            }
        }
    }
    
    // 等待足够长的时间确保资源释放
    std::thread::sleep(std::time::Duration::from_millis(500));
    
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
    
    // 计算窗口位置（居中显示）
    let window_width = 400;
    let window_height = 400;
    let x = monitor_pos.x + (monitor_size.width as i32 - window_width) / 2;
    let y = monitor_pos.y + (monitor_size.height as i32 - window_height) / 2;
    
    // 创建新窗口 - 使用简化的创建逻辑，减少复杂性
    
    // 检查窗口ID是否已经存在
    if app_handle.get_webview_window(&window_id).is_some() {
        let err_msg = format!("窗口ID {} 已存在，这不应该发生", window_id);
        println!("错误: {}", err_msg);
        return Err(err_msg);
    }
    
    println!("开始创建新窗口 {}", window_id);
    
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
    };
    
    // 使用监视器索引作为键，便于后续按监视器查找窗口
    let storage_key = format!("monitor_{}", monitor_index);
    
    println!("窗口创建成功并记录: 显示器 = {}, 窗口ID = {}", monitor_index, window_id);
    
    // 存储窗口实例信息
    get_window_instances().insert(storage_key, instance);
    
    // 返回创建的窗口ID
    Ok(window_id)
}

#[command]
pub async fn close_window_instance<R: Runtime>(
    app_handle: AppHandle<R>,
    window_id: String,
) -> Result<(), String> {
    println!("尝试关闭窗口实例: {}", window_id);
    
    // 先从映射中移除窗口实例，防止资源泄漏
    get_window_instances().remove(&window_id);
    
    // 然后尝试关闭窗口
    if let Some(window) = app_handle.get_webview_window(&window_id) {
        if let Err(e) = window.close() {
            let err_msg = format!("关闭窗口失败: {}", e);
            println!("警告: {}", err_msg);
            // 虽然关闭失败，但我们已经从映射中移除了窗口实例，所以返回成功
        }
    } else {
        println!("窗口实例 {} 不存在或已关闭", window_id);
    }
    
    // 等待一小段时间确保窗口资源被释放
    std::thread::sleep(std::time::Duration::from_millis(100));
    
    Ok(())
}

#[command]
pub async fn reset_window_positions<R: Runtime>(
    app_handle: AppHandle<R>,
) -> Result<(), String> {
    // 首先清空所有窗口实例记录
    get_window_instances().clear();
    
    // 重置主窗口位置
    if let Some(main_window) = app_handle.get_webview_window("main") {
        let monitors = app_handle.available_monitors()
            .map_err(|e| format!("获取显示器信息失败: {}", e))?;
        
        if !monitors.is_empty() {
            // 始终将主窗口移动到第一个显示器（主显示器）上
            let primary_monitor = &monitors[0];
            let monitor_pos = primary_monitor.position();
            let monitor_size = primary_monitor.size();
            
            // 计算居中位置
            let window_width = 400;
            let window_height = 400;
            let x = monitor_pos.x + (monitor_size.width as i32 - window_width) / 2;
            let y = monitor_pos.y + (monitor_size.height as i32 - window_height) / 2;
            
            println!("重置主窗口到主显示器: 位置({}, {})", x, y);
            
            // 设置位置并确保窗口可见
            main_window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x, y }))
                .map_err(|e| format!("设置主窗口位置失败: {}", e))?;
            
            // 确保窗口在前台可见
            let _ = main_window.show();
            let _ = main_window.set_focus();
        }
    }
    
    // 关闭所有以 monitor_ 开头的窗口实例
    println!("正在关闭所有克隆窗口");
    
    // 收集所有要关闭的窗口名称
    let clone_windows: Vec<String> = app_handle.webview_windows().iter()
        .map(|w| w.0.clone())
        .filter(|id| id.starts_with("monitor_"))
        .collect();
        
    println!("找到 {} 个克隆窗口需要关闭", clone_windows.len());
    
    // 逐个关闭窗口
    for name in clone_windows {
        println!("正在关闭窗口实例: {}", name);
        if let Some(window) = app_handle.get_webview_window(&name) {
            if let Err(e) = window.close() {
                println!("警告: 关闭窗口 {} 失败: {}", name, e);
            }
        }
    }
    
    // 清空窗口实例映射
    get_window_instances().clear();
    println!("已清空所有窗口实例记录");
    
    // 等待足够长的时间确保窗口资源被释放
    std::thread::sleep(std::time::Duration::from_millis(1000));
    
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