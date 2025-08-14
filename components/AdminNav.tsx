'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, ShoppingCart } from 'lucide-react'

const navItems = [
  {
    name: '仪表板',
    href: '/admin/dashboard',
    icon: LayoutDashboard
  },
  {
    name: '商品管理',
    href: '/admin/products',
    icon: Package
  },
  {
    name: '订单管理',
    href: '/admin/orders',
    icon: ShoppingCart
  }
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        const Icon = item.icon

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Icon className={`mr-3 w-5 h-5 ${
              isActive 
                ? 'text-blue-500' 
                : 'text-gray-400 group-hover:text-gray-500'
            }`} />
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}