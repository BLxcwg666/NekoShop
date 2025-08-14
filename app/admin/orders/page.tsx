'use client'

import { useState, useEffect } from 'react'
import { useAdminAuth } from '@/lib/hooks/useAdminAuth'
import { adminApi, isApiError } from '@/lib/api'
import { Order, CardKey } from '@/types'
import { 
  Search, 
  Filter, 
  AlertTriangle,
  ShoppingCart,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Package,
  Trash2,
  Edit,
  Key,
  Eye,
  X,
  CheckSquare
} from 'lucide-react'

interface OrderStatusUpdateProps {
  order: Order
  onUpdate: (orderId: string, newStatus: string) => void
  token: string
}

function OrderStatusUpdate({ order, onUpdate, token }: OrderStatusUpdateProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  
  const statusOptions = [
    { value: 'pending', label: '待处理', color: 'text-yellow-600' },
    { value: 'processing', label: '处理中', color: 'text-blue-600' },
    { value: 'completed', label: '已完成', color: 'text-green-600' },
    { value: 'cancelled', label: '已取消', color: 'text-red-600' }
  ]

  const handleStatusUpdate = async (newStatus: string) => {
    if (newStatus === order.status) return

    setIsUpdating(true)
    try {
      const response = await adminApi.updateOrderStatus(order.id, newStatus, token)
      if (response.success) {
        onUpdate(order.id, newStatus)
      } else {
        alert('状态更新失败')
      }
    } catch (err) {
      console.error('更新订单状态错误:', err)
      const errorMessage = isApiError(err) ? err.error.message : '状态更新失败'
      alert(errorMessage)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <select
      value={order.status}
      onChange={(e) => handleStatusUpdate(e.target.value)}
      disabled={isUpdating}
      className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
    >
      {statusOptions.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [orderCardKeys, setOrderCardKeys] = useState<CardKey[]>([])
  const [isCardKeysModalOpen, setIsCardKeysModalOpen] = useState(false)
  const [isLoadingCardKeys, setIsLoadingCardKeys] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [confirmReason, setConfirmReason] = useState('')
  const [isConfirming, setIsConfirming] = useState(false)
  const { user } = useAdminAuth()

  const loadOrders = async (status?: string) => {
    if (!user?.token) return

    try {
      setIsLoading(true)
      setError('')
      const response = await adminApi.getAllOrders(user.token, status === 'all' ? undefined : status)

      if (response.success) {
        setOrders(response.data)
        setFilteredOrders(response.data)
      } else {
        setError('获取订单列表失败')
      }
    } catch (err) {
      console.error('获取订单列表错误:', err)
      const errorMessage = isApiError(err) ? err.error.message : '获取订单列表失败'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadOrders(statusFilter)
  }, [user?.token, statusFilter])

  useEffect(() => {
    const filtered = orders.filter(order => 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerContact.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredOrders(filtered)
  }, [searchTerm, orders])

  const handleStatusFilterChange = (newFilter: string) => {
    setStatusFilter(newFilter)
  }

  const handleOrderStatusUpdate = (orderId: string, newStatus: string) => {
    const updatedOrders = orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus as Order['status'] } : order
    )
    setOrders(updatedOrders)
    
    const filtered = updatedOrders.filter(order =>
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerContact.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredOrders(filtered)
  }

  const handleViewCardKeys = async (orderId: string) => {
    if (!user?.token) return

    setSelectedOrderId(orderId)
    setIsCardKeysModalOpen(true)
    setIsLoadingCardKeys(true)
    setOrderCardKeys([])

    try {
      const response = await adminApi.getOrderCardKeys(orderId, user.token)
      if (response.success) {
        setOrderCardKeys(response.data)
      } else {
        alert('获取卡密信息失败')
      }
    } catch (err) {
      console.error('获取订单卡密错误:', err)
      const errorMessage = isApiError(err) ? err.error.message : '获取卡密信息失败'
      alert(errorMessage)
    } finally {
      setIsLoadingCardKeys(false)
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    if (!user?.token) return
    
    if (!confirm('确定要删除这个订单吗？此操作不可撤销。')) {
      return
    }

    try {
      const response = await adminApi.deleteOrder(orderId, user.token)
      if (response.success) {
        setOrders(orders.filter(o => o.id !== orderId))
        setFilteredOrders(filteredOrders.filter(o => o.id !== orderId))
      } else {
        alert('删除失败')
      }
    } catch (err) {
      console.error('删除订单错误:', err)
      const errorMessage = isApiError(err) ? err.error.message : '删除失败'
      alert(errorMessage)
    }
  }

  const handleManualConfirm = async (orderId: string) => {
    setSelectedOrderId(orderId)
    setIsConfirmModalOpen(true)
    setConfirmReason('')
  }

  const handleConfirmSubmit = async () => {
    if (!user?.token || !selectedOrderId || !confirmReason.trim()) return

    setIsConfirming(true)
    try {
      const response = await adminApi.manualConfirmOrder(selectedOrderId, confirmReason.trim(), user.token)
      if (response.success) {
        const updatedOrders = orders.map(order =>
          order.id === selectedOrderId 
            ? { 
                ...order, 
                status: response.data.status as Order['status'],
                paymentStatus: response.data.paymentStatus as Order['paymentStatus'],
                paidAt: response.data.paidAt,
                updatedAt: response.data.updatedAt
              } 
            : order
        )
        setOrders(updatedOrders)
        
        const filtered = updatedOrders.filter(order =>
          order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customerContact.toLowerCase().includes(searchTerm.toLowerCase())
        )
        setFilteredOrders(filtered)
        
        setIsConfirmModalOpen(false)
        setConfirmReason('')
        setSelectedOrderId(null)
        alert('订单确认成功')
      } else {
        alert('确认失败')
      }
    } catch (err) {
      console.error('手动确认订单错误:', err)
      const errorMessage = isApiError(err) ? err.error.message : '确认失败'
      alert(errorMessage)
    } finally {
      setIsConfirming(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-blue-600" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return '待处理'
      case 'processing':
        return '处理中'
      case 'completed':
        return '已完成'
      case 'cancelled':
        return '已取消'
      default:
        return status
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>加载订单列表中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            订单管理
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            管理和跟踪所有订单
          </p>
        </div>
        <button
          onClick={() => loadOrders(statusFilter)}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <RefreshCw className="w-4 h-4" />
          <span>刷新</span>
        </button>
      </div>

      {/* 搜索和过滤栏 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* 搜索框 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="搜索订单ID或客户联系方式..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* 状态过滤 */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">所有状态</option>
              <option value="pending">待处理</option>
              <option value="processing">处理中</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-red-800 dark:text-red-200">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* 订单列表 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              订单列表
            </h2>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              共 {filteredOrders.length} 个订单
            </span>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-6 text-center">
            <ShoppingCart className="mx-auto w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? '没有找到匹配的订单' : '暂无订单'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    订单信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    客户信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    商品
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    金额
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          #{order.id}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(order.createdAt)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {order.customerContact}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Package className="w-4 h-4 text-gray-400" />
                        <div>
                          {order.items.map((item, index) => (
                            <div key={index} className="text-sm text-gray-900 dark:text-white">
                              {item.productName} x{item.quantity}
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      ¥{order.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(order.status)}
                        {user?.token && (
                          <OrderStatusUpdate
                            order={order}
                            onUpdate={handleOrderStatusUpdate}
                            token={user.token}
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {order.paymentStatus === 'pending' && (
                          <button
                            onClick={() => handleManualConfirm(order.id)}
                            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                            title="手动确认订单"
                          >
                            <CheckSquare className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleViewCardKeys(order.id)}
                          className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                          title="查看卡密"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          title="删除订单"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 卡密查看模态框 */}
      {isCardKeysModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsCardKeysModalOpen(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  订单卡密信息 - #{selectedOrderId}
                </h2>
                <button
                  onClick={() => setIsCardKeysModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isLoadingCardKeys ? (
                <div className="p-6 text-center">
                  <RefreshCw className="mx-auto w-8 h-8 animate-spin text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">加载卡密信息中...</p>
                </div>
              ) : orderCardKeys.length === 0 ? (
                <div className="p-6 text-center">
                  <Key className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    该订单没有关联的卡密信息
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    共找到 {orderCardKeys.length} 个卡密
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            卡密内容
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            商品名称
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            状态
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            售出时间
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {orderCardKeys.map((cardKey) => (
                          <tr key={cardKey.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-4 py-3">
                              <div className="text-sm font-mono text-gray-900 dark:text-white">
                                {cardKey.cardKey}
                              </div>
                              {cardKey.remark && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {cardKey.remark}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                              {cardKey.productName || '-'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                cardKey.status === 'SOLD'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                                  : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                              }`}>
                                {cardKey.statusDescription}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                              {cardKey.soldAt ? new Date(cardKey.soldAt).toLocaleString('zh-CN') : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setIsCardKeysModalOpen(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 手动确认订单模态框 */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsConfirmModalOpen(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  手动确认订单
                </h2>
                <button
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    订单ID: #{selectedOrderId}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    请输入确认原因，此操作将立即确认订单支付状态并分配相应商品。
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    确认原因 *
                  </label>
                  <textarea
                    value={confirmReason}
                    onChange={(e) => setConfirmReason(e.target.value)}
                    placeholder="请说明手动确认的原因，如：客户线下支付、银行转账确认等"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    rows={3}
                    maxLength={200}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {confirmReason.length}/200
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                  disabled={isConfirming}
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmSubmit}
                  disabled={isConfirming || !confirmReason.trim()}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md flex items-center space-x-2"
                >
                  {isConfirming && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{isConfirming ? '确认中...' : '确认订单'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}