import { SimpleAdminAuthProvider } from '@/lib/hooks/useSimpleAdminAuth'

export const metadata = {
  title: '管理员登录 - NekoShop',
  description: 'NekoShop 管理员后台登录'
}

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SimpleAdminAuthProvider>
      {children}
    </SimpleAdminAuthProvider>
  )
}