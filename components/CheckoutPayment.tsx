'use client'

import { useState, useEffect } from 'react'
import { CreditCard, ExternalLink, Shield, Clock, TestTube } from 'lucide-react'
import { paymentApi, getErrorMessage } from '@/lib/api'
import { LoadingSpinner } from '@/components/LoadingSpinner'

interface CheckoutPaymentProps {
  orderId: string
  amount: number
  currency: string
  onPaymentError: (error: string) => void
}

export default function CheckoutPayment({ orderId, amount, currency, onPaymentError }: CheckoutPaymentProps) {
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [environment, setEnvironment] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEnvironment = async () => {
      try {
        const response = await paymentApi.getConfig()
        if (response.success) {
          setEnvironment('')
        }
      } catch (err) {
        console.error('获取支付环境信息失败:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchEnvironment()
  }, [])

  const handleCheckoutPayment = async () => {
    setProcessing(true)
    setError(null)

    try {
      const baseUrl = window.location.origin
      const successUrl = `${baseUrl}/payment/success`
      const cancelUrl = `${baseUrl}/payment/cancel`

      const response = await paymentApi.createCheckoutSession({
        orderId,
        amount,
        currency,
        successUrl,
        cancelUrl
      })

      if (!response.success) {
        throw new Error('创建支付会话失败')
      }

      window.location.href = response.data.checkoutUrl

    } catch (err) {
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      onPaymentError(errorMessage)
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
        <span className="ml-2 text-gray-600 dark:text-gray-400">加载支付配置...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 环境提示 */}
      {environment && environment.includes('测试') && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <TestTube className="h-5 w-5 text-yellow-500" />
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                当前环境：{environment}
              </h4>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                您可以使用测试卡号进行支付测试：4242424242424242
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 支付方式说明 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <Shield className="h-6 w-6 text-blue-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              安全便捷的在线支付
            </h3>
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              点击下方按钮将跳转到 Stripe 安全支付页面，支持信用卡、借记卡等多种支付方式。您的支付信息将得到最高级别的保护。
            </p>
          </div>
        </div>
      </div>

      {/* 支付信息卡片 */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          支付详情
        </h3>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">订单号:</span>
            <span className="font-medium text-gray-900 dark:text-white">{orderId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">支付金额:</span>
            <span className="font-semibold text-lg text-gray-900 dark:text-white">
              ¥{amount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">货币类型:</span>
            <span className="font-medium text-gray-900 dark:text-white uppercase">{currency}</span>
          </div>
        </div>
      </div>

      {/* 支付流程说明 */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Clock className="h-5 w-5 text-gray-500 mr-2" />
          <h4 className="font-medium text-gray-900 dark:text-white">支付流程</h4>
        </div>
        
        <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-start">
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
              1
            </span>
            点击支付按钮，跳转到 Stripe 安全支付页面
          </li>
          <li className="flex items-start">
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
              2
            </span>
            在 Stripe 页面填写您的支付信息
          </li>
          <li className="flex items-start">
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
              3
            </span>
            完成支付后，系统会自动返回到我们的网站
          </li>
          <li className="flex items-start">
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
              4
            </span>
            我们会立即处理您的订单并发送确认邮件
          </li>
        </ol>
      </div>

      {/* 错误信息 */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <svg className="h-5 w-5 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-medium text-red-800 dark:text-red-200">支付错误</h4>
              <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 支付按钮 */}
      <button
        onClick={handleCheckoutPayment}
        disabled={processing}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-3 text-lg"
      >
        {processing ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>创建支付会话中...</span>
          </>
        ) : (
          <>
            <CreditCard className="h-6 w-6" />
            <span>前往 Stripe 安全支付</span>
            <ExternalLink className="h-5 w-5" />
          </>
        )}
      </button>

      {/* 安全提示 */}
      <div className="text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          🔒 您的支付信息由 Stripe 提供 256 位 SSL 加密保护
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          我们不会存储您的信用卡信息
        </p>
      </div>
    </div>
  )
}