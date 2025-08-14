'use client'

import { useState, useEffect } from 'react'
import { useAdminAuth } from '@/lib/hooks/useAdminAuth'
import { adminApi, isApiError } from '@/lib/api'
import { SystemStats } from '@/types'
import { 
  Package, 
  ShoppingCart, 
  AlertTriangle, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react'

interface StatCardProps {
  title: string
  value: number | string
  icon: React.ElementType
  color: string
  description?: string
}

function StatCard({ title, value, icon: Icon, color, description }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{value}</p>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAdminAuth()

  const loadStats = async () => {
    if (!user?.token) return
    
    try {
      setIsLoading(true)
      setError('')
      const response = await adminApi.getSystemStats(user.token)
      
      if (response.success) {
        setStats(response.data)
      } else {
        setError('获取统计信息失败')
      }
    } catch (err) {
      console.error('获取统计信息错误:', err)
      const errorMessage = isApiError(err) ? err.error.message : '获取统计信息失败'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [user?.token])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>加载统计信息中...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-red-800 dark:text-red-200">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
        <button
          onClick={loadStats}
          className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
        >
          重试
        </button>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        暂无统计数据
      </div>
    )
  }

  const orderStatusItems = [
    { 
      status: 'pending', 
      label: '待处理', 
      icon: Clock, 
      color: 'text-yellow-600 dark:text-yellow-400' 
    },
    { 
      status: 'processing', 
      label: '处理中', 
      icon: RefreshCw, 
      color: 'text-blue-600 dark:text-blue-400' 
    },
    { 
      status: 'completed', 
      label: '已完成', 
      icon: CheckCircle, 
      color: 'text-green-600 dark:text-green-400' 
    },
    { 
      status: 'cancelled', 
      label: '已取消', 
      icon: XCircle, 
      color: 'text-red-600 dark:text-red-400' 
    }
  ]

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            仪表板
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            系统概览和关键指标
          </p>
        </div>
        <button
          onClick={loadStats}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>刷新</span>
        </button>
      </div>

      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="总商品数"
          value={stats.totalProducts}
          icon={Package}
          color="bg-blue-500"
          description="系统中的商品总数"
        />
        <StatCard
          title="总订单数"
          value={stats.totalOrders}
          icon={ShoppingCart}
          color="bg-green-500"
          description="所有订单数量"
        />
        <StatCard
          title="库存不足"
          value={stats.lowStockProducts}
          icon={AlertTriangle}
          color="bg-red-500"
          description="库存少于5个的商品"
        />
        <StatCard
          title="总销售额"
          value="¥0"
          icon={TrendingUp}
          color="bg-purple-500"
          description="累计销售金额"
        />
      </div>

      {/* 订单状态统计 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            订单状态分布
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            各状态订单的数量统计
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {orderStatusItems.map(({ status, label, icon: Icon, color }) => (
              <div key={status} className="text-center">
                <div className="flex flex-col items-center space-y-2">
                  <Icon className={`w-8 h-8 ${color}`} />
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {stats.ordersByStatus[status] || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            快速操作
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            常用的管理操作
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/admin/products"
              className="flex items-center justify-center space-x-2 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-gray-900 dark:text-white">管理商品</span>
            </a>
            <a
              href="/admin/orders"
              className="flex items-center justify-center space-x-2 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ShoppingCart className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-gray-900 dark:text-white">管理订单</span>
            </a>
            <button
              onClick={loadStats}
              className="flex items-center justify-center space-x-2 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="text-gray-900 dark:text-white">刷新数据</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}