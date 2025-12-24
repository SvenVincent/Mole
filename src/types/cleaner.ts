// 系统清理接口定义

export interface CleanItem {
  type: string          // 清理类型
  path: string          // 路径
  size: number          // 大小(bytes)
  description: string   // 描述
}

export interface CleanPlan {
  items: CleanItem[]    // 待清理项
  totalSize: number     // 总大小(bytes)
  totalItems: number    // 总数量
}

export interface CleanPlanPreview {
  items: CleanItem[]    // 待清理项
  totalSize: number     // 总大小(bytes)
}

export interface CleanResult {
  success: boolean      // 是否成功
  cleanedSize: number   // 已清理大小(bytes)
  released_size: number // 释放空间(bytes)
  failedItems: string[] // 失败项列表
}