'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Minus, Plus, ShoppingCart } from 'lucide-react'
import { Product, PurchaseForm, PaymentResult } from '@/types'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { productApi, orderApi, getErrorMessage } from '@/lib/api'
import { validateContact, getContactValidationError } from '@/lib/validation'
import { addPurchaseRecord } from '@/lib/purchaseCache'
import CheckoutPayment from '@/components/CheckoutPayment'

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)

  const [purchaseForm, setPurchaseForm] = useState<PurchaseForm>({
    customerContact: '',
    quantity: 1,
    queryPassword: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [orderCreated, setOrderCreated] = useState(false)
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)
  const [paymentStep, setPaymentStep] = useState<'form' | 'payment'>('form')

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await productApi.getProduct(productId)
        if (response.success) {
          setProduct(response.data)
        }
      } catch (err) {
        setError(getErrorMessage(err))
        console.error('获取商品详情失败:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId])

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 0)) {
      setQuantity(newQuantity)
      setPurchaseForm(prev => ({ ...prev, quantity: newQuantity }))
    }
  }



  const handleSubmitPurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    // 客户端验证
    const contactError = getContactValidationError(purchaseForm.customerContact)
    if (contactError) {
      alert(contactError)
      return
    }

    if (!purchaseForm.queryPassword.trim()) {
      alert('查询密码不能为空')
      return
    }

    setSubmitting(true)
    
    try {
      const response = await orderApi.createOrder({
        productId: product.id,
        quantity: purchaseForm.quantity,
        customerContact: purchaseForm.customerContact.trim(),
        queryPassword: purchaseForm.queryPassword
      })
      
      if (response.success) {
        setCreatedOrderId(response.data.orderId)
        setOrderCreated(true)
        setPaymentStep('payment')
        
        // 保存购买记录到缓存
        addPurchaseRecord({
          orderId: response.data.orderId,
          customerContact: purchaseForm.customerContact.trim(),
          queryPassword: purchaseForm.queryPassword,
          productName: product.name,
          totalAmount: product.price * purchaseForm.quantity
        })
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      alert(`订单创建失败: ${errorMessage}`)
      console.error('订单创建失败:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handlePaymentError = (error: string) => {
    console.error('支付失败:', error)
    alert(`支付失败: ${error}`)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            加载商品失败
          </h1>
          <p className="text-red-500 dark:text-red-300 mb-4">
            {error}
          </p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              重新加载
            </button>
            <button
              onClick={() => router.back()}
              className="text-red-600 dark:text-red-400 hover:underline"
            >
              返回上一页
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          商品未找到
        </h1>
        <button
          onClick={() => router.back()}
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          返回上一页
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>返回</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 商品图片 */}
        <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>

        {/* 商品信息和购买表单 */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {product.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-6">
              {product.description}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              ¥{product.price.toFixed(2)}
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              库存: {product.stock}
            </span>
          </div>

          {product.stock > 0 ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              {paymentStep === 'form' && (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    购买信息
                  </h3>
                  
                  <form onSubmit={handleSubmitPurchase} className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-700 dark:text-gray-300 min-w-[60px]">数量:</span>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(quantity - 1)}
                          disabled={quantity <= 1}
                          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-12 text-center font-medium">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(quantity + 1)}
                          disabled={quantity >= product.stock}
                          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400 ml-auto">
                        总计: ¥{(product.price * quantity).toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        联系方式 *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="请输入QQ号或邮箱（纯数字将自动添加@qq.com）"
                        value={purchaseForm.customerContact}
                        onChange={(e) =>
                          setPurchaseForm(prev => ({ ...prev, customerContact: e.target.value, quantity }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        查询密码 *
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="请设置一个查询密码（用于后续查询订单）"
                        value={purchaseForm.queryPassword}
                        onChange={(e) =>
                          setPurchaseForm(prev => ({ ...prev, queryPassword: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        请牢记此密码，用于查询订单状态
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      <span>{submitting ? '创建订单中...' : '创建订单'}</span>
                    </button>
                  </form>
                </>
              )}

              {paymentStep === 'payment' && createdOrderId && (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    支付订单
                  </h3>
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-blue-700 dark:text-blue-400">
                      订单创建成功！订单号: <strong>{createdOrderId}</strong>
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                      请完成支付以确认您的订单
                    </p>
                  </div>
                  <CheckoutPayment
                    orderId={createdOrderId}
                    amount={product.price * quantity}
                    currency="cny"
                    onPaymentError={handlePaymentError}
                  />
                </>
              )}


            </div>
          ) : (
            <div className="text-center py-8">
              <span className="text-xl font-medium text-red-500">商品已售罄</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}