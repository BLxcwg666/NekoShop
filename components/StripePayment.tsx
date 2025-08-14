'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { paymentApi, getErrorMessage } from '@/lib/api'
import { PaymentResult } from '@/types'
import { Loader2, CreditCard, CheckCircle, AlertCircle } from 'lucide-react'

let stripePromise: Promise<any> | null = null

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')
  }
  return stripePromise
}

interface StripePaymentProps {
  orderId: string
  amount: number
  currency: string
  onPaymentSuccess: (result: PaymentResult) => void
  onPaymentError: (error: string) => void
}

function PaymentForm({ orderId, amount, currency, onPaymentSuccess, onPaymentError }: StripePaymentProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'succeeded' | 'failed'>('idle')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)
    setError(null)
    setPaymentStatus('processing')

    try {
      const paymentIntentResponse = await paymentApi.createPaymentIntent({
        orderId,
        amount: Math.round(amount * 100), // 转换为分
        currency
      })

      if (!paymentIntentResponse.success) {
        throw new Error('创建支付意图失败')
      }

      const { clientSecret } = paymentIntentResponse.data

      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error('无法获取支付卡片元素')
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      })

      if (stripeError) {
        setError(stripeError.message || '支付失败')
        setPaymentStatus('failed')
        onPaymentError(stripeError.message || '支付失败')
      } else if (paymentIntent.status === 'succeeded') {
        setPaymentStatus('succeeded')
        onPaymentSuccess({
          success: true,
          paymentIntentId: paymentIntent.id
        })
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      setPaymentStatus('failed')
      onPaymentError(errorMessage)
    } finally {
      setProcessing(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  }

  if (paymentStatus === 'succeeded') {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-green-600 mb-2">支付成功！</h3>
        <p className="text-gray-600">您的订单已支付成功，我们将尽快处理您的订单。</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <CreditCard className="h-4 w-4 inline mr-2" />
          支付卡片信息
        </label>
        <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
      >
        {processing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>处理中...</span>
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5" />
            <span>支付 ¥{amount.toFixed(2)}</span>
          </>
        )}
      </button>

      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
        您的支付信息将通过Stripe安全处理
      </p>
    </form>
  )
}

export default function StripePayment(props: StripePaymentProps) {
  const [stripePublicKey, setStripePublicKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPaymentConfig = async () => {
      try {
        const response = await paymentApi.getConfig()
        if (response.success) {
          setStripePublicKey(response.data.publicKey)
        } else {
          setError('获取支付配置失败')
        }
      } catch (err) {
        setError(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }

    loadPaymentConfig()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">加载支付组件...</span>
      </div>
    )
  }

  if (error || !stripePublicKey) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-red-600 mb-2">支付组件加载失败</h3>
        <p className="text-gray-600">{error || '无法获取支付配置'}</p>
      </div>
    )
  }

  return (
    <Elements stripe={getStripe()}>
      <PaymentForm {...props} />
    </Elements>
  )
}