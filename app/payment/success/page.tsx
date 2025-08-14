'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, ArrowRight, Package, Clock } from 'lucide-react'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { orderApi } from '@/lib/api'

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setError('缺少支付会话ID')
      setLoading(false)
      return
    }

    const fetchOrder = async () => {
      try {
        const response = await orderApi.getOrderBySessionId(sessionId)
        if (response.success) {
          setOrder(response.data)
        } else {
          setError('查询订单信息失败')
        }
      } catch (err) {
        console.error('查询订单失败:', err)
        setError('查询订单信息失败，请稍后重试')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [sessionId])

  const handleViewOrders = () => {
    if (order) {
      router.push(`/orders?orderId=${order.id}`)
    } else {
      router.push('/orders')
    }
  }

  const handleContinueShopping = () => {
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600 dark:text-gray-400">正在确认您的支付...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">出现错误</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={handleContinueShopping}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            返回商店
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* 成功头部 */}
          <div className="bg-green-50 dark:bg-green-900/20 p-8 text-center">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
              支付成功
            </h1>
            <p className="text-green-700 dark:text-green-300">
              感谢您的购买，我们已收到您的付款
            </p>
            {sessionId && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                支付会话: {sessionId.substring(0, 20)}...
              </p>
            )}
          </div>

          {/* 订单信息 */}
          <div className="p-8">
            <div className="border rounded-lg p-6 mb-6">
              <div className="flex items-center mb-4">
                <Package className="h-6 w-6 text-blue-500 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  订单信息
                </h2>
              </div>
              
              {order && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">订单号</p>
                      <p className="font-medium text-gray-900 dark:text-white">{order.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">订单金额</p>
                      <p className="font-medium text-gray-900 dark:text-white">¥{order.totalAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">订单状态</p>
                      <p className="font-medium text-gray-900 dark:text-white">已确认</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">支付状态</p>
                      <p className="font-medium text-green-600 dark:text-green-400">已支付</p>
                    </div>
                  </div>
                  
                  {/* 商品详情 */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">购买商品</h3>
                    {order.items && order.items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center py-2">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{item.productName}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">数量: {item.quantity}</p>
                        </div>
                        <p className="font-medium text-gray-900 dark:text-white">¥{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) || (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">订单状态</p>
                    <p className="font-medium text-gray-900 dark:text-white">已确认</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">支付状态</p>
                    <p className="font-medium text-green-600 dark:text-green-400">已支付</p>
                  </div>
                </div>
              )}
            </div>

            {/* 下一步操作 */}
            <div className="border rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Clock className="h-6 w-6 text-blue-500 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  接下来会发生什么？
                </h2>
              </div>
              
              <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                {order && order.items && order.items.some((item: any) => item.productType === 'CARD_KEY') ? (
                  <>
                    <li className="flex items-start">
                      <span className="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                        ✓
                      </span>
                      卡密商品已自动发放，您可以立即查看
                    </li>
                    <li className="flex items-start">
                      <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                        2
                      </span>
                      请保存好您的卡密信息，避免泄露
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start">
                      <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                        1
                      </span>
                      我们将立即开始处理您的订单
                    </li>
                    <li className="flex items-start">
                      <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                        2
                      </span>
                      您将收到一封确认邮件，包含订单详情
                    </li>
                    <li className="flex items-start">
                      <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                        3
                      </span>
                      商品准备好后，我们会通知您发货信息
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* 操作按钮 */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button
                onClick={handleViewOrders}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
              >
                {order ? '查看订单详情' : '查看我的订单'}
                <ArrowRight className="h-5 w-5 ml-2" />
              </button>
              <button
                onClick={handleContinueShopping}
                className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                继续购物
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}