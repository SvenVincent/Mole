//! 搜索历史服务实现 - 使用 DuckDB

use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};
use duckdb::{Connection, params};
use crate::models::search_history::SearchHistoryItem;

/// 搜索历史服务
pub struct SearchHistoryService {
    db_path: PathBuf,
}

impl SearchHistoryService {
    /// 创建新的搜索历史服务实例（不自动创建数据库）
    pub fn new() -> Self {
        let db_path = Self::get_db_path();
        SearchHistoryService { db_path }
    }

    /// 获取数据库文件路径
    fn get_db_path() -> PathBuf {
        // 优先使用用户应用数据目录
        if let Some(data_dir) = dirs::data_local_dir() {
            return data_dir.join("com.mole.app").join("search_history.db");
        }
        
        // 备用：使用可执行文件所在目录
        let exe_path = std::env::current_exe().unwrap_or_default();
        let exe_dir = exe_path.parent().unwrap_or(std::path::Path::new("."));
        exe_dir.join("db").join("search_history.db")
    }

    /// 检查数据库文件是否存在
    fn db_exists(&self) -> bool {
        self.db_path.exists()
    }

    /// 获取数据库连接（仅当数据库存在时）
    fn get_connection(&self) -> Option<Connection> {
        if !self.db_exists() {
            return None;
        }
        Connection::open(&self.db_path).ok()
    }

    /// 获取或创建数据库连接（用于写操作）
    fn get_or_create_connection(&self) -> Option<Connection> {
        // 确保目录存在
        if let Some(parent) = self.db_path.parent() {
            if fs::create_dir_all(parent).is_err() {
                return None;
            }
        }
        Connection::open(&self.db_path).ok()
    }

    /// 初始化数据库表结构（懒加载）
    fn ensure_table(&self, conn: &Connection) -> bool {
        // 先创建序列
        let _ = conn.execute("CREATE SEQUENCE IF NOT EXISTS search_history_seq START 1", []);
        
        // 创建表，使用序列生成 id
        let create_table = conn.execute(
            "CREATE TABLE IF NOT EXISTS search_history (
                id INTEGER PRIMARY KEY DEFAULT nextval('search_history_seq'),
                keyword VARCHAR NOT NULL,
                page VARCHAR NOT NULL,
                timestamp UBIGINT NOT NULL
            )",
            [],
        );
        
        if create_table.is_err() {
            println!("[SearchHistory] Failed to create table: {:?}", create_table);
            return false;
        }

        // 创建索引
        let _ = conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_search_history_page ON search_history(page)",
            [],
        );
        let _ = conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_search_history_page_keyword ON search_history(page, keyword)",
            [],
        );
        
        true
    }

    /// 获取指定页面的搜索历史
    pub fn get_search_history(&self, page: &str) -> Vec<SearchHistoryItem> {
        // 数据库不存在时返回空数组
        let Some(conn) = self.get_connection() else {
            return Vec::new();
        };
        
        let mut result = Vec::new();
        if let Ok(mut stmt) = conn.prepare(
            "SELECT keyword, page, timestamp FROM search_history 
             WHERE page = ? 
             ORDER BY timestamp DESC"
        ) {
            if let Ok(rows) = stmt.query_map(params![page], |row| {
                Ok(SearchHistoryItem {
                    keyword: row.get(0)?,
                    page: row.get(1)?,
                    timestamp: row.get(2)?,
                })
            }) {
                for row in rows.flatten() {
                    result.push(row);
                }
            }
        }
        
        result
    }

    /// 添加搜索历史（会自动创建数据库）
    pub fn add_search_history(&self, keyword: String, page: String) -> bool {
        println!("[SearchHistory] Adding: keyword='{}', page='{}'", keyword, page);
        
        if keyword.trim().is_empty() {
            println!("[SearchHistory] Error: keyword is empty");
            return false;
        }

        let Some(conn) = self.get_or_create_connection() else {
            println!("[SearchHistory] Error: failed to get connection");
            return false;
        };
        println!("[SearchHistory] DB path: {:?}", self.db_path);

        // 确保表存在
        if !self.ensure_table(&conn) {
            println!("[SearchHistory] Error: failed to create table");
            return false;
        }
        println!("[SearchHistory] Table ensured");

        // 删除相同页面的重复关键词
        let _ = conn.execute(
            "DELETE FROM search_history WHERE page = ? AND keyword = ?",
            params![&page, &keyword],
        );

        // 添加新记录
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        let insert_result = conn.execute(
            "INSERT INTO search_history (keyword, page, timestamp) VALUES (?, ?, ?)",
            params![&keyword, &page, timestamp],
        );
        println!("[SearchHistory] Insert result: {:?}", insert_result);

        if insert_result.is_err() {
            println!("[SearchHistory] Error: insert failed");
            return false;
        }

        // 限制每个页面最多保存 20 条历史记录
        let _ = conn.execute(
            "DELETE FROM search_history 
             WHERE page = ? AND id NOT IN (
                 SELECT id FROM search_history 
                 WHERE page = ? 
                 ORDER BY timestamp DESC 
                 LIMIT 20
             )",
            params![&page, &page],
        );

        // 强制将 WAL 数据写入主数据库文件
        let _ = conn.execute("CHECKPOINT", []);

        true
    }

    /// 清除指定页面的搜索历史
    pub fn clear_search_history(&self, page: &str) -> bool {
        // 数据库不存在时直接返回成功
        let Some(conn) = self.get_connection() else {
            return true;
        };
        let result = conn.execute(
            "DELETE FROM search_history WHERE page = ?",
            params![page],
        ).is_ok();
        let _ = conn.execute("CHECKPOINT", []);
        result
    }

    /// 删除单条搜索历史
    pub fn delete_search_history(&self, keyword: &str, page: &str) -> bool {
        // 数据库不存在时直接返回成功
        let Some(conn) = self.get_connection() else {
            return true;
        };
        let result = conn.execute(
            "DELETE FROM search_history WHERE page = ? AND keyword = ?",
            params![page, keyword],
        ).is_ok();
        let _ = conn.execute("CHECKPOINT", []);
        result
    }
}
