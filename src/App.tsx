import { RouterProvider } from 'react-router-dom'
import { useThemeStore } from '@/stores/theme'
import { router } from '@/router'
import { useEffect } from 'react'

export default function App() {
  const { resolvedTheme } = useThemeStore()

  // 应用主题到 document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme)
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
  }, [resolvedTheme])

  return <RouterProvider router={router} />
}
