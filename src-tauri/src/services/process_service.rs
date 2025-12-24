//! 进程服务实现

use sysinfo::{System, Signal};
use crate::models::process::{Process, ProcessList};

/// 进程服务
pub struct ProcessService;

impl ProcessService {
    /// 创建新的进程服务实例
    pub fn new() -> Self {
        ProcessService
    }

    /// 获取进程列表
    pub fn get_process_list(&self) -> ProcessList {
        let mut system = System::new_all();
        system.refresh_all();

        let mut processes = Vec::new();

        for (pid, process) in system.processes() {
            processes.push(Process {
                pid: pid.as_u32(),
                name: process.name().to_string_lossy().to_string(),
                cpu_usage: process.cpu_usage() / 100.0,
                memory_usage: if system.total_memory() > 0 {
                    process.memory() as f32 / system.total_memory() as f32
                } else {
                    0.0
                },
                status: format!("{:?}", process.status()),
                start_time: process.start_time(),
            });
        }

        ProcessList { processes }
    }

    /// 结束进程
    pub fn kill_process(&self, pid: u32) -> bool {
        let mut system = System::new_all();
        system.refresh_all();

        if let Some(process) = system.process(sysinfo::Pid::from_u32(pid)) {
            // 先尝试 SIGTERM (优雅结束)
            if process.kill_with(Signal::Term).unwrap_or(false) {
                return true;
            }
            // 如果失败，尝试 SIGKILL (强制结束)
            process.kill_with(Signal::Kill).unwrap_or(false)
        } else {
            println!("Process with pid {} not found", pid);
            false
        }
    }
}