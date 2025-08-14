'use client'

import { useRouter } from 'next/navigation'
import { XCircle, ArrowLeft, CreditCard } from 'lucide-react'

export default function PaymentCancelPage() {
  const router = useRouter()

  const handleReturnToShop = () => {
    router.push('/')
  }

  const handleRetryPayment = () => {
    router.back()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* 取消头部 */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-8 text-center">
            <XCircle className="h-20 w-20 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
              支付已取消
            </h1>
            <p className="text-yellow-700 dark:text-yellow-300">
              您的支付过程被中断，订单尚未完成
            </p>
          </div>

          {/* 内容区域 */}
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                发生了什么？
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                您在支付过程中选择了取消，或者支付过程被中断。不用担心，您的订单仍然保存着，可以随时重新完成支付。
              </p>
            </div>

            {/* 提示信息 */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
              <div className="flex items-start">
                <CreditCard className="h-6 w-6 text-blue-500 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    重新尝试支付
                  </h3>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    您可以返回订单页面重新完成支付，您的商品信息都已保存。我们支持多种支付方式，让支付更便捷。
                  </p>
                </div>
              </div>
            </div>

            {/* 可能的原因 */}
            <div className="mb-8">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                可能的原因：
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mr-3 mt-2"></span>
                  手动取消了支付过程
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mr-3 mt-2"></span>
                  网络连接问题导致支付中断
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mr-3 mt-2"></span>
                  支付信息填写有误
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mr-3 mt-2"></span>
                  浏览器或设备问题
                </li>
              </ul>
            </div>

            {/* 操作按钮 */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleRetryPayment}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                重新尝试支付
              </button>
              <button
                onClick={handleReturnToShop}
                className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                返回商店
              </button>
            </div>

            {/* 帮助信息 */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                如果您在支付过程中遇到问题，请联系我们的客服团队
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}