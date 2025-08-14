'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from './ThemeToggle'
import { ShoppingCart, Search } from 'lucide-react'

export function Header() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <header className="header-glass sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <ShoppingCart className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
              libxcnya.soの杂货铺
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className={`transition-colors ${
                isActive('/')
                  ? 'text-blue-600 dark:text-blue-400 font-medium'
                  : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              商品列表
            </Link>
            <Link
              href="/orders"
              className={`transition-colors ${
                isActive('/orders')
                  ? 'text-blue-600 dark:text-blue-400 font-medium'
                  : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              订单查询
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
          </div>
        </div>

        {/* 移动端导航 */}
        <div className="md:hidden pb-3">
          <nav className="flex space-x-4">
            <Link
              href="/"
              className={`text-sm transition-colors ${
                isActive('/')
                  ? 'text-blue-600 dark:text-blue-400 font-medium'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              商品列表
            </Link>
            <Link
              href="/orders"
              className={`text-sm transition-colors ${
                isActive('/orders')
                  ? 'text-blue-600 dark:text-blue-400 font-medium'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              订单查询
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}