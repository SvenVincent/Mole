import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/Shared/Sidebar'
import ToastContainer from '@/components/Shared/ToastContainer'

export default function AppLayout() {
  return (
    <div className="flex h-full w-full overflow-hidden bg-app">
      <Sidebar />
      <main className="flex-1 overflow-hidden flex flex-col">
        <Outlet />
      </main>
      <ToastContainer />
    </div>
  )
}
