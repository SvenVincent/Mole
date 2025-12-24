// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

// 导入所有功能模块
mod models;
mod services;
mod commands;

// 重导出所有命令，以便在前端调用
pub use commands::*;

#[cfg(target_os = "macos")]
use tauri::{TitleBarStyle, WebviewUrl, WebviewWindowBuilder};

// 示例命令，可保留或删除
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// 设置窗口背景色（从前端调用）
#[tauri::command]
fn set_window_bg_color(window: tauri::Window, r: f64, g: f64, b: f64, a: f64) {
    #[cfg(target_os = "macos")]
    {
        use cocoa::appkit::{NSColor, NSWindow};
        use cocoa::base::{id, nil};

        if let Ok(ns_window) = window.ns_window() {
            let ns_window = ns_window as id;
            unsafe {
                let bg_color = NSColor::colorWithRed_green_blue_alpha_(
                    nil,
                    r / 255.0,
                    g / 255.0,
                    b / 255.0,
                    a,
                );
                ns_window.setBackgroundColor_(bg_color);
            }
        }
    }
    
    #[cfg(not(target_os = "macos"))]
    {
        let _ = (window, r, g, b, a);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // macOS: 使用透明标题栏创建窗口
            #[cfg(target_os = "macos")]
            {
                let win_builder = WebviewWindowBuilder::new(
                    app,
                    "main",
                    WebviewUrl::default()
                )
                .title("Mole")
                .inner_size(1200.0, 800.0)
                .resizable(true)
                .title_bar_style(TitleBarStyle::Transparent);

                let window = win_builder.build()?;

                // 设置默认背景色（浅色主题）
                use cocoa::appkit::{NSColor, NSWindow};
                use cocoa::base::{id, nil};

                if let Ok(ns_window) = window.ns_window() {
                    let ns_window = ns_window as id;
                    unsafe {
                        // 默认浅色主题背景
                        let bg_color = NSColor::colorWithRed_green_blue_alpha_(
                            nil,
                            245.0 / 255.0,
                            245.0 / 255.0,
                            245.0 / 255.0,
                            0.95,
                        );
                        ns_window.setBackgroundColor_(bg_color);
                    }
                }
            }

            // 非 macOS: 使用配置文件的窗口设置
            #[cfg(not(target_os = "macos"))]
            {
                // 窗口已由 tauri.conf.json 创建
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // 示例命令
            greet,
            // 系统信息命令
            get_system_info,
            get_cpu_info,
            get_memory_info,
            get_disk_info,
            get_battery_info,
            get_gpu_info,
            get_network_speed,
            
            // 进程管理命令
            get_process_list,
            kill_process,
            get_process_icon,
            
            // 磁盘分析命令
            scan_directory,
            find_large_files,
            scan_directory_deep,
            get_directory_children,
            get_home_directory,
            
            // 系统清理命令
            preview_clean_plan,
            execute_clean,
            
            // 应用管理命令
            get_installed_apps,
            get_duplicatable_apps,
            get_app_size,
            get_app_icon,
            uninstall_app,
            get_app_related_files,
            force_uninstall_app,
            force_delete_files,
            quick_duplicate_app,
            create_duplicate_app,
            
            // 设置命令
            get_settings,
            update_settings,
            
            // 搜索历史命令
            get_search_history,
            add_search_history,
            clear_search_history,
            delete_search_history,
            
            // 窗口命令
            set_window_bg_color,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
