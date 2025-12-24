//! 数据模型定义模块
//!
//! 该模块包含了所有用于前后端数据交互的结构体定义，
//! 包括系统信息、进程信息、磁盘信息、清理项等。

pub mod system;
pub mod process;
pub mod disk;
pub mod cleaner;
pub mod app;
pub mod settings;
pub mod search_history;

// 为了避免未使用导入警告，我们只在需要的地方使用这些模块
// pub use system::*;
// pub use process::*;
// pub use disk::*;
// pub use cleaner::*;
// pub use app::*;
// pub use settings::*;