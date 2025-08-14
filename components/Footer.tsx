import Link from 'next/link'
import { Heart, Mail, Phone, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="footer-glass mt-16 relative z-40">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 店铺信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              libxcnya.soの杂货铺
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              你说的对但是这里应该是简介但是我不知道写什么所以这里现在是你看到的这个样子
            </p>
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <Heart className="h-4 w-4 text-red-500" />
              <span className="text-sm">用心挑选，温暖生活</span>
            </div>
          </div>

          {/* 快速链接 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              快速导航
            </h3>
            <nav className="space-y-2">
              <Link 
                href="/" 
                className="block text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
              >
                商品列表
              </Link>
              <Link 
                href="/orders" 
                className="block text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
              >
                订单查询
              </Link>
              <a 
                href="#" 
                className="block text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
              >
                购买须知
              </a>
              <a 
                href="#" 
                className="block text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
              >
                常见问题
              </a>
            </nav>
          </div>

          {/* 联系信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              联系我们
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                <Mail className="h-4 w-4" />
                <span className="text-sm">me@xcnya.cn</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                <Phone className="h-4 w-4" />
                <span className="text-sm">+1 (813)-463-0865</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">Worldwide.</span>
              </div>
            </div>
          </div>
        </div>

        {/* 底部版权信息 */}
        <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              © {new Date().getFullYear()} libxcnya.soの杂货铺 All rights reserved.
            </p>
            <div className="flex space-x-4 text-sm">
              <a 
                href="#" 
                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                隐私政策
              </a>
              <a 
                href="#" 
                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                服务条款
              </a>
              <a 
                href="#" 
                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                退换政策
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}