// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

// 导入所有功能模块
mod models;
mod services;
mod commands;

// 重导出所有命令，以便在前端调用
pub use commands::*;

// 示例命令，可保留或删除
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}