/**
 * 应用主布局
 * 
 * 包含侧边栏、主内容区域和通知容器
 * macOS 使用透明标题栏，标题栏区域需要留白
 */

import { Outlet } from 'react-router-dom'
import { Box } from '@mui/material'
import Sidebar from '@/components/Shared/Sidebar'
import ToastContainer from '@/components/Shared/ToastContainer'

// macOS 透明标题栏高度
const TITLEBAR_HEIGHT = 28

export default function AppLayout() {
  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        bgcolor: 'background.default',
        // macOS 标题栏拖拽区域
        pt: `${TITLEBAR_HEIGHT}px`,
      }}
    >
      <Sidebar />
      <Box
        component="main"
        sx={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Outlet />
      </Box>
      <ToastContainer />
    </Box>
  )
}
