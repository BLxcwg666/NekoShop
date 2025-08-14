import { AdminAuthProvider } from '@/lib/hooks/useAdminAuth'
import { AdminProtectedRoute } from '@/components/AdminProtectedRoute'
import { AdminLayout } from '@/components/AdminLayout'

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminAuthProvider>
      <AdminProtectedRoute>
        <AdminLayout>
          {children}
        </AdminLayout>
      </AdminProtectedRoute>
    </AdminAuthProvider>
  )
}

export const metadata = {
  title: '管理员后台',
  description: 'NekoShop 管理员后台系统'
}