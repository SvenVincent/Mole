import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import AppLayout from '@/layouts/AppLayout'
import LoadingSpinner from '@/components/Shared/LoadingSpinner'

// 懒加载页面组件
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const CleanerPage = lazy(() => import('@/pages/CleanerPage'))
const OptimizerPage = lazy(() => import('@/pages/OptimizerPage'))
const ProcessPage = lazy(() => import('@/pages/ProcessPage'))
const DiskPage = lazy(() => import('@/pages/DiskPage'))
const UninstallPage = lazy(() => import('@/pages/UninstallPage'))
const DuplicatorPage = lazy(() => import('@/pages/DuplicatorPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))

// 页面加载包装器
const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={
    <div className="flex items-center justify-center h-full">
      <LoadingSpinner size={32} />
    </div>
  }>
    {children}
  </Suspense>
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <PageWrapper><Dashboard /></PageWrapper>
      },
      {
        path: 'cleaner',
        element: <PageWrapper><CleanerPage /></PageWrapper>
      },
      {
        path: 'optimizer',
        element: <PageWrapper><OptimizerPage /></PageWrapper>
      },
      {
        path: 'process',
        element: <PageWrapper><ProcessPage /></PageWrapper>
      },
      {
        path: 'disk',
        element: <PageWrapper><DiskPage /></PageWrapper>
      },
      {
        path: 'uninstall',
        element: <PageWrapper><UninstallPage /></PageWrapper>
      },
      {
        path: 'duplicator',
        element: <PageWrapper><DuplicatorPage /></PageWrapper>
      },
      {
        path: 'settings',
        element: <PageWrapper><SettingsPage /></PageWrapper>
      },
      // 404 重定向到首页
      {
        path: '*',
        element: <Navigate to="/" replace />
      },
    ],
  },
])
