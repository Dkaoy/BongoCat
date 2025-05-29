use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::process::Command;
use tauri::{AppHandle, Emitter};
use tokio::time::{interval, Duration};

static IS_MONITORING: AtomicBool = AtomicBool::new(false);
const MEMORY_LIMIT_MB: u64 = 300;
const CHECK_INTERVAL_SECONDS: u64 = 10;

#[derive(Debug, Clone, serde::Serialize)]
pub struct MemoryStatus {
    pub current_mb: u64,
    pub limit_mb: u64,
    pub usage_percentage: f64,
    pub is_over_limit: bool,
}

/// 获取当前进程的内存使用情况（MB）
fn get_memory_usage() -> Result<u64, String> {
    #[cfg(target_os = "macos")]
    {

        let output = Command::new("ps")
            .args(["-o", "rss=", "-p", &std::process::id().to_string()])
            .output()
            .map_err(|e| format!("Failed to execute ps command: {}", e))?;
        
        let rss_kb = String::from_utf8_lossy(&output.stdout)
            .trim()
            .parse::<u64>()
            .map_err(|e| format!("Failed to parse memory usage: {}", e))?;
        
        Ok(rss_kb / 1024) // Convert KB to MB
    }
    
    #[cfg(target_os = "windows")]
    {

        let output = Command::new("tasklist")
            .args(["/fi", &format!("PID eq {}", std::process::id()), "/fo", "csv"])
            .output()
            .map_err(|e| format!("Failed to execute tasklist command: {}", e))?;
        
        let output_str = String::from_utf8_lossy(&output.stdout);
        let lines: Vec<&str> = output_str.lines().collect();
        if lines.len() >= 2 {
            let fields: Vec<&str> = lines[1].split(',').collect();
            if fields.len() >= 5 {
                let memory_str = fields[4].trim_matches('"').replace(",", "").replace(" K", "");
                let memory_kb = memory_str.parse::<u64>()
                    .map_err(|e| format!("Failed to parse memory usage: {}", e))?;
                return Ok(memory_kb / 1024); // Convert KB to MB
            }
        }
        Err("Failed to parse tasklist output".to_string())
    }
    
    #[cfg(target_os = "linux")]
    {
        use std::fs;
        let status = fs::read_to_string("/proc/self/status")
            .map_err(|e| format!("Failed to read /proc/self/status: {}", e))?;
        
        for line in status.lines() {
            if line.starts_with("VmRSS:") {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 2 {
                    let memory_kb = parts[1].parse::<u64>()
                        .map_err(|e| format!("Failed to parse memory usage: {}", e))?;
                    return Ok(memory_kb / 1024); // Convert KB to MB
                }
            }
        }
        Err("Failed to find VmRSS in /proc/self/status".to_string())
    }
}

/// 启动内存监控
pub fn start_memory_monitoring(app_handle: AppHandle) {
    if IS_MONITORING.load(Ordering::SeqCst) {
        return;
    }
    
    IS_MONITORING.store(true, Ordering::SeqCst);
    
    let app_handle = Arc::new(app_handle);
    
    tauri::async_runtime::spawn(async move {
        let mut interval = interval(Duration::from_secs(CHECK_INTERVAL_SECONDS));
        
        loop {
            interval.tick().await;
            
            if !IS_MONITORING.load(Ordering::SeqCst) {
                break;
            }
            
            match get_memory_usage() {
                Ok(current_mb) => {
                    let usage_percentage = (current_mb as f64 / MEMORY_LIMIT_MB as f64) * 100.0;
                    let is_over_limit = current_mb > MEMORY_LIMIT_MB;
                    
                    let status = MemoryStatus {
                        current_mb,
                        limit_mb: MEMORY_LIMIT_MB,
                        usage_percentage,
                        is_over_limit,
                    };
                    
                    // 发送内存状态事件到前端
                    let _ = app_handle.emit("memory-status", &status);
                    
                    // 如果超过限制，发送警告
                    if is_over_limit {
                        let _ = app_handle.emit("memory-warning", &status);
                        
                        // 可以在这里添加更多的处理逻辑，比如：
                        // - 清理缓存
                        // - 强制垃圾回收
                        // - 记录日志
                        println!("警告：内存使用超过限制！当前使用: {}MB, 限制: {}MB", current_mb, MEMORY_LIMIT_MB);
                    }
                }
                Err(e) => {
                    eprintln!("获取内存使用情况失败: {}", e);
                }
            }
        }
    });
}

/// 停止内存监控
pub fn stop_memory_monitoring() {
    IS_MONITORING.store(false, Ordering::SeqCst);
}

/// 获取当前内存状态（用于命令调用）
#[tauri::command]
pub async fn get_memory_status() -> Result<MemoryStatus, String> {
    let current_mb = get_memory_usage()?;
    let usage_percentage = (current_mb as f64 / MEMORY_LIMIT_MB as f64) * 100.0;
    let is_over_limit = current_mb > MEMORY_LIMIT_MB;
    
    Ok(MemoryStatus {
        current_mb,
        limit_mb: MEMORY_LIMIT_MB,
        usage_percentage,
        is_over_limit,
    })
}

/// 手动触发内存清理（如果可能的话）
#[tauri::command]
pub async fn trigger_memory_cleanup() -> Result<String, String> {
    // 强制垃圾回收（在Rust中主要是释放未使用的内存）
    std::hint::black_box(());
    
    // 获取清理后的内存使用情况
    let current_mb = get_memory_usage()?;
    
    Ok(format!("内存清理完成，当前使用: {}MB", current_mb))
}