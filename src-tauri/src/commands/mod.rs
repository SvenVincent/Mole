//! Tauri命令处理模块
//!
//! 该模块包含了所有通过Tauri IPC调用的命令处理函数，
//! 作为前端与后端业务逻辑之间的桥梁。

pub mod system_commands;
pub mod process_commands;
pub mod disk_commands;
pub mod cleaner_commands;
pub mod app_commands;
pub mod settings_commands;
pub mod search_history_commands;

// 为了避免未使用导入警告，我们只在需要的地方使用这些模块
pub use system_commands::*;
pub use process_commands::*;
pub use disk_commands::*;
pub use cleaner_commands::*;
pub use app_commands::*;
pub use settings_commands::*;
pub use search_history_commands::*;