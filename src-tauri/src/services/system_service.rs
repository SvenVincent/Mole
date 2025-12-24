//! 系统信息服务实现

use sysinfo::{System, Disks, Networks};
use std::process::Command;
use std::sync::Mutex;
use crate::models::system::{SystemInfo, CpuInfo, MemoryInfo, Disk, DiskInfo, BatteryInfo, NetworkInterface, NetworkSpeed, GpuInfo};

/// 网络状态缓存（用于计算网速）
static NETWORK_CACHE: Mutex<Option<(u64, u64, std::time::Instant)>> = Mutex::new(None);

/// 公网 IP 缓存（IP, 国家代码, 获取时间）- 缓存 60 秒
static PUBLIC_IP_CACHE: Mutex<Option<(String, String, std::time::Instant)>> = Mutex::new(None);
const PUBLIC_IP_CACHE_DURATION: u64 = 60; // 缓存有效期 60 秒

/// CPU System 对象缓存（保持状态以计算使用率）
static CPU_SYSTEM: Mutex<Option<System>> = Mutex::new(None);

/// GPU 名称缓存
static GPU_NAME_CACHE: Mutex<Option<String>> = Mutex::new(None);

/// 系统信息服务
pub struct SystemService;

impl SystemService {
    /// 创建新的系统信息服务实例
    pub fn new() -> Self {
        SystemService
    }

    /// 获取系统基本信息
    pub fn get_system_info(&self) -> SystemInfo {
        let mut system = System::new_all();
        system.refresh_all();

        SystemInfo {
            hostname: System::host_name().unwrap_or_default(),
            os_version: System::long_os_version().unwrap_or_default(),
            kernel_version: System::kernel_version().unwrap_or_default(),
            uptime: System::uptime(),
            load_average: [0.0, 0.0, 0.0], // sysinfo 新版本中获取方式不同
        }
    }

    /// 获取CPU信息
    pub fn get_cpu_info(&self) -> CpuInfo {
        // 使用缓存的 System 对象来计算 CPU 使用率
        let mut system_guard = CPU_SYSTEM.lock().unwrap();
        
        if system_guard.is_none() {
            let mut sys = System::new_all();
            sys.refresh_all();
            *system_guard = Some(sys);
        }
        
        let system = system_guard.as_mut().unwrap();
        
        // 等待一小段时间后再刷新，以获取准确的 CPU 使用率
        std::thread::sleep(std::time::Duration::from_millis(200));
        system.refresh_cpu_all();
        
        let cpu = system.cpus().first().unwrap();
        let cpu_usage = system.global_cpu_usage();
        
        CpuInfo {
            name: cpu.name().to_string(),
            vendor_id: cpu.vendor_id().to_string(),
            brand: cpu.brand().to_string(),
            frequency: cpu.frequency(),
            cpu_usage: cpu_usage / 100.0,
            physical_cores: sysinfo::System::physical_core_count().unwrap_or(0),
            logical_cores: system.cpus().len(),
        }
    }

    /// 获取内存信息
    pub fn get_memory_info(&self) -> MemoryInfo {
        let mut system = System::new_all();
        system.refresh_all();

        let total_mem = system.total_memory();
        let used_mem = system.used_memory();
        let free_mem = system.free_memory();
        let mem_usage = if total_mem > 0 {
            used_mem as f32 / total_mem as f32
        } else {
            0.0
        };

        let swap_total = system.total_swap();
        let swap_used = system.used_swap();

        MemoryInfo {
            total_mem,
            used_mem,
            free_mem,
            mem_usage,
            swap_total,
            swap_used,
        }
    }

    /// 获取磁盘信息
    pub fn get_disk_info(&self) -> DiskInfo {
        let mut system = System::new_all();
        system.refresh_all();

        let mut disks_data = Vec::new();
        let mut total_space = 0u64;
        let mut available_space = 0u64;
        let mut used_space = 0u64;

        // 使用 Disks 来获取磁盘信息
        let disks = Disks::new_with_refreshed_list();

        for disk in &disks {
            let disk_total = disk.total_space();
            let disk_available = disk.available_space();
            let disk_used = disk_total - disk_available;
            let disk_usage = if disk_total > 0 {
                disk_used as f32 / disk_total as f32
            } else {
                0.0
            };

            let mount_point = disk.mount_point().to_string_lossy().to_string();

            // 只统计主磁盘（挂载点为 / 或 /System/Volumes/Data）
            if mount_point == "/" || mount_point == "/System/Volumes/Data" {
                // 避免重复统计（macOS 上 / 和 /System/Volumes/Data 是同一个磁盘）
                if total_space == 0 {
                    total_space = disk_total;
                    available_space = disk_available;
                    used_space = disk_used;
                }
            }

            disks_data.push(Disk {
                name: disk.name().to_string_lossy().to_string(),
                mount_point,
                total_space: disk_total,
                available_space: disk_available,
                used_space: disk_used,
                disk_usage,
            });
        }

        let disk_usage = if total_space > 0 {
            used_space as f32 / total_space as f32
        } else {
            0.0
        };

        DiskInfo {
            total_space,
            available_space,
            used_space,
            disk_usage,
            disks: disks_data,
        }
    }

    /// 获取电池信息 (macOS) - 优化版，只使用 ioreg 获取数据
    pub fn get_battery_info(&self) -> BatteryInfo {
        let mut info = BatteryInfo {
            has_battery: false,
            power_connected: false,
            percentage: 0.0,
            is_charging: false,
            is_full: false,
            time_remaining: -1,
            health: 100.0,
            cycle_count: 0,
            voltage: 0,
            amperage: 0,
            power_watts: 0.0,
            current_capacity: 0,
            max_capacity: 0,
            design_capacity: 0,
        };

        // 使用 ioreg 获取所有电池信息（比 system_profiler 快很多）
        let ioreg_output = Command::new("ioreg")
            .args(["-r", "-c", "AppleSmartBattery"])
            .output();

        if let Ok(output) = ioreg_output {
            let stdout = String::from_utf8_lossy(&output.stdout);
            
            if stdout.contains("AppleSmartBattery") {
                info.has_battery = true;
            }
            
            let mut max_capacity: u32 = 0;
            let mut design_capacity: u32 = 0;
            let mut is_charging = false;
            let mut is_fully_charged = false;
            let mut external_connected = false;
            let mut time_to_empty: i32 = -1;
            let mut time_to_full: i32 = -1;
            
            for line in stdout.lines() {
                let line_trimmed = line.trim();
                
                // 是否连接电源适配器
                if line_trimmed.contains("\"ExternalConnected\" =") {
                    external_connected = line_trimmed.contains("Yes");
                }
                
                // 充电状态
                if line_trimmed.contains("\"IsCharging\" =") {
                    is_charging = line_trimmed.contains("Yes");
                }
                
                // 已充满
                if line_trimmed.contains("\"FullyCharged\" =") {
                    is_fully_charged = line_trimmed.contains("Yes");
                }
                
                // 当前电量百分比
                if line_trimmed.contains("\"CurrentCapacity\" =") && !line_trimmed.contains("Raw") {
                    if let Some(eq_idx) = line_trimmed.find('=') {
                        if let Ok(pct) = line_trimmed[eq_idx + 1..].trim().parse::<f32>() {
                            info.percentage = pct;
                        }
                    }
                }
                
                // 剩余放电时间 (分钟) - 65535 表示未知/计算中
                if line_trimmed.contains("\"TimeRemaining\" =") {
                    if let Some(eq_idx) = line_trimmed.find('=') {
                        if let Ok(mins) = line_trimmed[eq_idx + 1..].trim().parse::<i32>() {
                            // 过滤不合理的值 (65535 = 0xFFFF 表示未知，超过24小时也不合理)
                            if mins > 0 && mins < 1440 {
                                time_to_empty = mins;
                            }
                        }
                    }
                }
                
                // 充满所需时间 (分钟)
                if line_trimmed.contains("\"AvgTimeToFull\" =") {
                    if let Some(eq_idx) = line_trimmed.find('=') {
                        if let Ok(mins) = line_trimmed[eq_idx + 1..].trim().parse::<i32>() {
                            // 过滤不合理的值
                            if mins > 0 && mins < 1440 {
                                time_to_full = mins;
                            }
                        }
                    }
                }
                
                // 循环次数
                if line_trimmed.contains("\"CycleCount\" =") && !line_trimmed.contains("DesignCycleCount") {
                    if let Some(eq_idx) = line_trimmed.find('=') {
                        if let Ok(count) = line_trimmed[eq_idx + 1..].trim().parse::<u32>() {
                            info.cycle_count = count;
                        }
                    }
                }
                
                // 最大容量 (mAh)
                if line_trimmed.contains("\"AppleRawMaxCapacity\" =") {
                    if let Some(eq_idx) = line_trimmed.find('=') {
                        if let Ok(cap) = line_trimmed[eq_idx + 1..].trim().parse::<u32>() {
                            max_capacity = cap;
                            info.max_capacity = cap;
                        }
                    }
                }
                
                // 设计容量 (mAh)
                if line_trimmed.contains("\"DesignCapacity\" =") && !line_trimmed.contains("Fed") {
                    if let Some(eq_idx) = line_trimmed.find('=') {
                        if let Ok(cap) = line_trimmed[eq_idx + 1..].trim().parse::<u32>() {
                            design_capacity = cap;
                            info.design_capacity = cap;
                        }
                    }
                }
                
                // 当前容量 (mAh)
                if line_trimmed.contains("\"AppleRawCurrentCapacity\" =") {
                    if let Some(eq_idx) = line_trimmed.find('=') {
                        if let Ok(cap) = line_trimmed[eq_idx + 1..].trim().parse::<u32>() {
                            info.current_capacity = cap;
                        }
                    }
                }
                
                // 电压 (mV)
                if line_trimmed.contains("\"AppleRawBatteryVoltage\" =") {
                    if let Some(eq_idx) = line_trimmed.find('=') {
                        if let Ok(v) = line_trimmed[eq_idx + 1..].trim().parse::<u32>() {
                            info.voltage = v;
                        }
                    }
                }
                
                // 电流 (mA)
                if line_trimmed.contains("\"Amperage\" =") && !line_trimmed.contains("Instant") {
                    if let Some(eq_idx) = line_trimmed.find('=') {
                        if let Ok(a) = line_trimmed[eq_idx + 1..].trim().parse::<i32>() {
                            info.amperage = a;
                        }
                    }
                }
            }
            
            // 设置电源状态
            info.power_connected = external_connected;
            info.is_charging = is_charging;
            info.is_full = is_fully_charged || info.percentage >= 100.0;
            
            // 计算功率 (W) = 电压(V) * 电流(A) = (mV/1000) * (mA/1000)
            if info.voltage > 0 && info.amperage != 0 {
                info.power_watts = (info.voltage as f32 / 1000.0) * (info.amperage.abs() as f32 / 1000.0);
            }
            
            // 设置剩余时间
            if info.is_full {
                // 已充满，时间为 0
                info.time_remaining = 0;
            } else if info.is_charging && time_to_full > 0 {
                // 充电中，显示充满所需时间
                info.time_remaining = time_to_full;
            } else if !info.is_charging && !info.power_connected && time_to_empty > 0 {
                // 放电中且未连接电源，显示剩余可用时间
                info.time_remaining = time_to_empty;
            }
            
            // 先用计算值作为默认健康度
            if design_capacity > 0 && max_capacity > 0 {
                info.health = (max_capacity as f32 / design_capacity as f32 * 100.0).min(100.0);
            }
        }
        
        // 使用 system_profiler 获取系统显示的精确健康度
        let profiler_output = Command::new("system_profiler")
            .args(["SPPowerDataType"])
            .output();

        if let Ok(output) = profiler_output {
            let stdout = String::from_utf8_lossy(&output.stdout);
            
            for line in stdout.lines() {
                let line_trimmed = line.trim();
                
                // 健康度 (最大容量百分比) - 英文系统
                if line_trimmed.starts_with("Maximum Capacity:") {
                    let value = line_trimmed.replace("Maximum Capacity:", "").trim().replace("%", "");
                    if let Ok(health) = value.parse::<f32>() {
                        info.health = health;
                        break;
                    }
                }
                // 健康度 - 中文系统
                if line_trimmed.contains("最大容量") && line_trimmed.contains("%") {
                    // 提取百分比数字
                    if let Some(start) = line_trimmed.rfind(":") {
                        let value = line_trimmed[start + 1..].trim().replace("%", "").replace(" ", "");
                        if let Ok(health) = value.parse::<f32>() {
                            info.health = health;
                            break;
                        }
                    }
                }
            }
        }

        info
    }

    /// 获取 GPU 信息 (macOS) - 优化版，GPU 名称缓存
    pub fn get_gpu_info(&self) -> GpuInfo {
        let mut info = GpuInfo {
            name: String::new(),
            gpu_usage: 0.0,
            memory_usage: 0.0,
        };

        // 先从缓存获取 GPU 名称
        {
            let cache = GPU_NAME_CACHE.lock().unwrap();
            if let Some(name) = cache.as_ref() {
                info.name = name.clone();
            }
        }

        // 如果缓存中没有 GPU 名称，使用 system_profiler 获取（只执行一次）
        if info.name.is_empty() {
            let profiler_output = Command::new("system_profiler")
                .args(["SPDisplaysDataType"])
                .output();

            if let Ok(output) = profiler_output {
                let stdout = String::from_utf8_lossy(&output.stdout);
                
                for line in stdout.lines() {
                    let line_trimmed = line.trim();
                    
                    // GPU 名称 - 英文系统
                    if line_trimmed.starts_with("Chipset Model:") {
                        info.name = line_trimmed.replace("Chipset Model:", "").trim().to_string();
                        break;
                    }
                    // GPU 名称 - 中文系统
                    if line_trimmed.contains("芯片组型号") && line_trimmed.contains(":") {
                        if let Some(idx) = line_trimmed.find(':') {
                            info.name = line_trimmed[idx + 1..].trim().to_string();
                            break;
                        }
                    }
                }
                
                // 缓存 GPU 名称
                if !info.name.is_empty() {
                    let mut cache = GPU_NAME_CACHE.lock().unwrap();
                    *cache = Some(info.name.clone());
                }
            }
        }

        // 使用 ioreg 获取 GPU 使用率 (快速，每次都执行)
        let ioreg_output = Command::new("ioreg")
            .args(["-r", "-d", "1", "-c", "IOAccelerator"])
            .output();

        if let Ok(output) = ioreg_output {
            let stdout = String::from_utf8_lossy(&output.stdout);
            
            // 在 PerformanceStatistics 中查找 "Device Utilization %"=XX
            let search_str = "\"Device Utilization %\"=";
            if let Some(start) = stdout.find(search_str) {
                let after_eq = &stdout[start + search_str.len()..];
                let end_idx = after_eq.find(|c: char| !c.is_ascii_digit()).unwrap_or(after_eq.len());
                if let Ok(usage) = after_eq[..end_idx].parse::<f32>() {
                    info.gpu_usage = usage;
                }
            }
        }

        info
    }

    /// 获取网络速度信息
    pub fn get_network_speed(&self) -> NetworkSpeed {
        let networks = Networks::new_with_refreshed_list();
        
        let mut total_received: u64 = 0;
        let mut total_transmitted: u64 = 0;
        let mut interfaces = Vec::new();
        let mut local_ip = String::new();
        let mut local_ipv6 = String::new();

        for (name, data) in &networks {
            let received = data.total_received();
            let transmitted = data.total_transmitted();
            
            total_received += received;
            total_transmitted += transmitted;

            // 获取 IP 地址
            let ip_addresses: Vec<String> = data.ip_networks()
                .iter()
                .map(|ip| ip.addr.to_string())
                .collect();

            // 记录第一个非回环 IP
            for ip in &ip_addresses {
                if !ip.starts_with("127.") && !ip.starts_with("::1") {
                    if !ip.contains(':') && local_ip.is_empty() {
                        // IPv4
                        local_ip = ip.clone();
                    } else if ip.contains(':') && local_ipv6.is_empty() && !ip.starts_with("fe80") {
                        // IPv6 (排除链路本地地址)
                        local_ipv6 = ip.clone();
                    }
                }
            }

            // 判断接口类型
            let interface_type = Self::get_interface_type(name);
            
            // 判断是否连接 (有 IP 且有流量)
            let has_valid_ip = ip_addresses.iter().any(|ip| {
                !ip.starts_with("127.") && !ip.starts_with("::1")
            });
            let is_connected = has_valid_ip && (received > 0 || transmitted > 0);

            interfaces.push(NetworkInterface {
                name: name.to_string(),
                ip_addresses,
                mac_address: data.mac_address().to_string(),
                received_bytes: received,
                transmitted_bytes: transmitted,
                interface_type,
                is_connected,
            });
        }

        // 计算网速
        let (download_speed, upload_speed) = {
            let mut cache = NETWORK_CACHE.lock().unwrap();
            let now = std::time::Instant::now();
            
            if let Some((prev_rx, prev_tx, prev_time)) = cache.take() {
                let elapsed = now.duration_since(prev_time).as_secs_f64();
                if elapsed > 0.0 {
                    let dl = ((total_received.saturating_sub(prev_rx)) as f64 / elapsed) as u64;
                    let ul = ((total_transmitted.saturating_sub(prev_tx)) as f64 / elapsed) as u64;
                    *cache = Some((total_received, total_transmitted, now));
                    (dl, ul)
                } else {
                    *cache = Some((total_received, total_transmitted, now));
                    (0, 0)
                }
            } else {
                *cache = Some((total_received, total_transmitted, now));
                (0, 0)
            }
        };

        // 获取公网 IP 和国家代码
        let (public_ip, country_code) = self.get_public_ip();
        
        // 获取 WiFi SSID 和网络类型
        let (wifi_ssid, network_type) = self.get_wifi_info();

        NetworkSpeed {
            download_speed,
            upload_speed,
            total_received,
            total_transmitted,
            local_ip,
            local_ipv6,
            public_ip,
            country_code,
            wifi_ssid,
            network_type,
            interfaces,
        }
    }

    /// 获取接口类型
    fn get_interface_type(name: &str) -> String {
        let lower = name.to_lowercase();
        if lower == "en0" || lower.starts_with("wl") || lower.contains("wifi") || lower.contains("wlan") {
            "wifi".to_string()
        } else if lower.starts_with("en") || lower.starts_with("eth") {
            "ethernet".to_string()
        } else if lower.starts_with("utun") || lower.contains("vpn") || lower.contains("tun") {
            "vpn".to_string()
        } else if lower.starts_with("bridge") || lower.starts_with("br") {
            "bridge".to_string()
        } else {
            "other".to_string()
        }
    }

    /// 获取 WiFi 信息 (SSID, 网络类型) - 使用 sysinfo 检测网络类型
    fn get_wifi_info(&self) -> (String, String) {
        // 使用 sysinfo 检查网络接口
        let networks = Networks::new_with_refreshed_list();
        let mut en0_has_valid_ip = false;
        
        for (name, data) in &networks {
            if name == "en0" {
                let ip_addresses: Vec<String> = data.ip_networks()
                    .iter()
                    .map(|ip| ip.addr.to_string())
                    .collect();
                
                // 检查是否有有效 IP (排除回环和链路本地地址)
                en0_has_valid_ip = ip_addresses.iter().any(|ip| {
                    !ip.starts_with("127.") && !ip.starts_with("::1") && !ip.starts_with("fe80")
                });
                break;
            }
        }
        
        // 如果 en0 有有效 IP，检查是否是 Wi-Fi 接口
        if en0_has_valid_ip {
            // 检查 en0 硬件端口类型
            let hw_output = Command::new("networksetup")
                .args(["-listallhardwareports"])
                .output();
            
            if let Ok(hw) = hw_output {
                let hw_stdout = String::from_utf8_lossy(&hw.stdout);
                
                // 检查 en0 是否是 Wi-Fi 接口
                if hw_stdout.contains("Hardware Port: Wi-Fi") && 
                   hw_stdout.contains("Device: en0") {
                    // 获取当前连接的 WiFi SSID
                    let ssid = self.get_current_wifi_ssid();
                    return (ssid, "wifi".to_string());
                }
            }
        }
        
        // 检查其他网络接口是否有有线连接
        for (name, data) in &networks {
            if name == "en0" {
                continue; // 跳过 en0，已经检查过
            }
            
            let ip_addresses: Vec<String> = data.ip_networks()
                .iter()
                .map(|ip| ip.addr.to_string())
                .collect();
            
            let has_valid_ip = ip_addresses.iter().any(|ip| {
                !ip.starts_with("127.") && !ip.starts_with("::1") && !ip.starts_with("fe80")
            });
            
            if has_valid_ip {
                let lower_name = name.to_lowercase();
                // 检查是否是以太网接口
                if lower_name.starts_with("en") || lower_name.starts_with("eth") {
                    return (String::new(), "ethernet".to_string());
                }
            }
        }

        (String::new(), "unknown".to_string())
    }

    /// 获取当前连接的 WiFi SSID
    fn get_current_wifi_ssid(&self) -> String {
        // 使用 networksetup 获取首选网络列表，第一个通常是当前连接的
        let output = Command::new("networksetup")
            .args(["-listpreferredwirelessnetworks", "en0"])
            .output();

        if let Ok(output) = output {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout);
                // 获取第二行 (第一行是标题)，并去除制表符
                if let Some(line) = stdout.lines().nth(1) {
                    let ssid = line.trim().to_string();
                    if !ssid.is_empty() {
                        return ssid;
                    }
                }
            }
        }

        String::new()
    }

    /// 获取公网 IP 地址和国家代码（带缓存）
    fn get_public_ip(&self) -> (String, String) {
        // 检查缓存
        {
            let cache = PUBLIC_IP_CACHE.lock().unwrap();
            if let Some((ip, country, cached_time)) = cache.as_ref() {
                if cached_time.elapsed().as_secs() < PUBLIC_IP_CACHE_DURATION {
                    return (ip.clone(), country.clone());
                }
            }
        }

        // 缓存过期或不存在，使用 ip-api.com 获取 IP 和国家信息
        let output = Command::new("curl")
            .args(["-s", "--max-time", "3", "http://ip-api.com/json/?fields=query,countryCode"])
            .output();

        let (ip, country) = if let Ok(output) = output {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout);
                // 解析 JSON: {"query":"1.2.3.4","countryCode":"US"}
                let mut ip = String::from("未连接");
                let mut country = String::new();
                
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(&stdout) {
                    if let Some(query) = json.get("query").and_then(|v| v.as_str()) {
                        ip = query.to_string();
                    }
                    if let Some(code) = json.get("countryCode").and_then(|v| v.as_str()) {
                        country = code.to_lowercase();
                    }
                }
                
                (ip, country)
            } else {
                (String::from("未连接"), String::new())
            }
        } else {
            (String::from("未连接"), String::new())
        };

        // 更新缓存
        {
            let mut cache = PUBLIC_IP_CACHE.lock().unwrap();
            *cache = Some((ip.clone(), country.clone(), std::time::Instant::now()));
        }

        (ip, country)
    }
}
