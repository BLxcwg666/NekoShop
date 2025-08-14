'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Package, Calendar, CreditCard, Phone, Mail, Key, Eye, EyeOff, Copy, CheckCircle, Clock, Trash2, X, ShoppingCart, ExternalLink } from 'lucide-react'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Order, CardKey } from '@/types'
import { orderApi, getErrorMessage, paymentApi } from '@/lib/api'
import { validateContact, getContactValidationError } from '@/lib/validation'
import { 
  getCachedOrders, 
  addOrderToCache, 
  removeOrderFromCache, 
  clearOrderCache, 
  getCachedOrderPassword,
  type CachedOrder 
} from '@/lib/orderCache'
import { 
  getPurchaseRecords, 
  getLatestPurchaseRecord,
  removePurchaseRecord,
  clearPurchaseRecords,
  getPurchaseRecordByOrderId,
  type PurchaseRecord 
} from '@/lib/purchaseCache'

const statusMap = {
  pending: { label: '待处理', color: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900' },
  processing: { label: '处理中', color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900' },
  completed: { label: '已完成', color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900' },
  cancelled: { label: '已取消', color: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900' }
}

const paymentStatusMap = {
  pending: { label: '待支付', color: 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900' },
  processing: { label: '支付中', color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900' },
  succeeded: { label: '已支付', color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900' },
  failed: { label: '支付失败', color: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900' },
  cancelled: { label: '支付取消', color: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900' },
  refunded: { label: '已退款', color: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900' }
}

function OrdersPageContent() {
  const searchParams = useSearchParams()
  const urlOrderId = searchParams.get('orderId')
  
  const [searchType, setSearchType] = useState<'orderId' | 'contact'>('orderId')
  const [orderId, setOrderId] = useState(urlOrderId || '')
  const [contact, setContact] = useState('')
  const [password, setPassword] = useState('')
  const [searchResult, setSearchResult] = useState<Order | Order[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  
  // 缓存相关状态
  const [cachedOrders, setCachedOrders] = useState<CachedOrder[]>([])
  const [showCachedOrders, setShowCachedOrders] = useState(true)
  
  // 购买记录状态
  const [purchaseRecords, setPurchaseRecords] = useState<PurchaseRecord[]>([])
  const [showPurchaseRecords, setShowPurchaseRecords] = useState(true)

  // 加载缓存的订单和购买记录
  useEffect(() => {
    const loadCachedOrders = () => {
      const cached = getCachedOrders()
      setCachedOrders(cached)
    }
    
    const loadPurchaseRecords = () => {
      const records = getPurchaseRecords()
      setPurchaseRecords(records)
    }
    
    loadCachedOrders()
    loadPurchaseRecords()
  }, [])

  // 如果URL中有orderId参数，提示用户输入密码
  useEffect(() => {
    if (urlOrderId && !searchResult) {
      setError('请输入订单查询密码来查看订单详情')
    }
  }, [urlOrderId, searchResult])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setSearching(true)
    setError('')
    setSearchResult(null)

    try {
      if (searchType === 'orderId') {
        // 验证订单号
        if (!orderId.trim()) {
          setError('订单号不能为空')
          return
        }
        if (!password.trim()) {
          setError('查询密码不能为空')
          return
        }
        
        // 通过订单号查询
        const response = await orderApi.getOrder(orderId.trim(), password)
        if (response.success) {
          setSearchResult(response.data)
          // 添加到缓存
          addOrderToCache(response.data, password)
          // 刷新缓存显示
          setCachedOrders(getCachedOrders())
        }
      } else {
        // 验证联系方式
        const contactError = getContactValidationError(contact)
        if (contactError) {
          setError(contactError)
          return
        }
        if (!password.trim()) {
          setError('查询密码不能为空')
          return
        }
        
        // 通过联系方式查询
        const response = await orderApi.searchOrders({
          customerContact: contact.trim(),
          queryPassword: password
        })
        if (response.success) {
          if (response.data.length === 0) {
            setError('未找到匹配的订单，请检查信息是否正确')
          } else {
            setSearchResult(response.data)
            // 将所有查到的订单添加到缓存
            response.data.forEach(order => {
              addOrderToCache(order, password)
            })
            // 刷新缓存显示
            setCachedOrders(getCachedOrders())
          }
        }
      }
    } catch (err) {
      setError(getErrorMessage(err))
      console.error('订单查询失败:', err)
    } finally {
      setSearching(false)
    }
  }

  // 处理缓存订单的辅助函数
  const handleViewCachedOrder = (cachedOrder: CachedOrder) => {
    setSearchResult(cachedOrder.order)
    setError('')
    // 根据订单信息设置查询表单，方便用户重新查询
    setOrderId(cachedOrder.order.id)
    setSearchType('orderId')
  }

  const handleRemoveCachedOrder = (orderId: string) => {
    removeOrderFromCache(orderId)
    setCachedOrders(getCachedOrders())
  }

  const handleClearCache = () => {
    if (confirm('确定要清空所有缓存的订单吗？')) {
      clearOrderCache()
      setCachedOrders([])
    }
  }

  // 处理购买记录的函数
  const handleViewPurchaseRecord = async (record: PurchaseRecord) => {
    setSearching(true)
    setError('')
    setSearchResult(null)

    try {
      // 自动填入订单信息并查询
      setSearchType('orderId')
      setOrderId(record.orderId)
      setPassword('')
      
      // 获取解码后的密码
      const decodedRecord = getPurchaseRecordByOrderId(record.orderId)
      const queryPassword = decodedRecord?.queryPassword || record.queryPassword
      
      const response = await orderApi.getOrder(record.orderId, queryPassword)
      if (response.success) {
        setSearchResult(response.data)
        // 添加到缓存
        addOrderToCache(response.data, queryPassword)
        // 刷新缓存显示
        setCachedOrders(getCachedOrders())
      }
    } catch (err) {
      setError(getErrorMessage(err))
      console.error('订单查询失败:', err)
    } finally {
      setSearching(false)
    }
  }

  const handleRemovePurchaseRecord = (orderId: string) => {
    removePurchaseRecord(orderId)
    setPurchaseRecords(getPurchaseRecords())
  }

  const handleClearPurchaseRecords = () => {
    if (confirm('确定要清空所有购买记录吗？')) {
      clearPurchaseRecords()
      setPurchaseRecords([])
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const getContactIcon = (contact: string) => {
    return contact.includes('@') ? <Mail className="h-4 w-4" /> : <Phone className="h-4 w-4" />
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          订单查询
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          输入订单号或联系方式以及查询密码来查询您的订单状态
        </p>
      </div>

      {/* 我的购买记录 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5 text-green-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              我的购买记录 ({purchaseRecords.length})
            </h2>
          </div>
          {purchaseRecords.length > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowPurchaseRecords(!showPurchaseRecords)}
                className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {showPurchaseRecords ? '隐藏' : '显示'}
              </button>
              <button
                onClick={handleClearPurchaseRecords}
                className="text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400 flex items-center space-x-1"
              >
                <Trash2 className="h-4 w-4" />
                <span>清空</span>
              </button>
            </div>
          )}
        </div>
        
        {purchaseRecords.length > 0 && showPurchaseRecords ? (
          <div className="space-y-3">
            {purchaseRecords.map((record) => (
              <div
                key={record.orderId}
                className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors border border-green-200 dark:border-green-800"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {record.orderId}
                        </span>
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                          购买记录
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {record.productName}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          {getContactIcon(record.customerContact)}
                          <span>{record.customerContact}</span>
                        </div>
                        <span>¥{record.totalAmount.toFixed(2)}</span>
                        <span>{formatDate(record.purchaseTime)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleViewPurchaseRecord(record)}
                    disabled={searching}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {searching ? '查询中...' : '查看订单'}
                  </button>
                  <button
                    onClick={() => handleRemovePurchaseRecord(record.orderId)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="移除记录"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              购买记录将在30天后自动过期，最多保留20条记录
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              您还没有购买过任何商品
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              购买商品后，系统会自动保存购买记录，方便您快速查看订单
            </p>
          </div>
        )}
      </div>

      {/* 最近查询区域 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              最近查询的订单 ({cachedOrders.length})
            </h2>
          </div>
          {cachedOrders.length > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowCachedOrders(!showCachedOrders)}
                className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {showCachedOrders ? '隐藏' : '显示'}
              </button>
              <button
                onClick={handleClearCache}
                className="text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400 flex items-center space-x-1"
              >
                <Trash2 className="h-4 w-4" />
                <span>清空</span>
              </button>
            </div>
          )}
        </div>
        
        {cachedOrders.length > 0 && showCachedOrders ? (
          <div className="space-y-3">
            {cachedOrders.map((cachedOrder) => (
              <div
                key={cachedOrder.order.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {cachedOrder.order.id}
                        </span>
                        <div className="flex space-x-1">
                          <span className={`px-2 py-1 text-xs rounded ${statusMap[cachedOrder.order.status].color}`}>
                            {statusMap[cachedOrder.order.status].label}
                          </span>
                          {cachedOrder.order.paymentStatus && (
                            <span className={`px-2 py-1 text-xs rounded ${paymentStatusMap[cachedOrder.order.paymentStatus]?.color || 'text-gray-600 bg-gray-100'}`}>
                              {paymentStatusMap[cachedOrder.order.paymentStatus]?.label || cachedOrder.order.paymentStatus}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          {getContactIcon(cachedOrder.order.customerContact)}
                          <span>{cachedOrder.order.customerContact}</span>
                        </div>
                        <span>¥{cachedOrder.order.totalAmount.toFixed(2)}</span>
                        <span>{formatDate(cachedOrder.cachedAt)} 查询</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleViewCachedOrder(cachedOrder)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    查看
                  </button>
                  <button
                    onClick={() => handleRemoveCachedOrder(cachedOrder.order.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="移除"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              缓存将在7天后自动过期，最多保留10个订单
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              您还没有查询过任何订单
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              查询订单后，系统会自动缓存订单信息，方便您下次快速查看
            </p>
          </div>
        )}
      </div>

      {/* 查询表单 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <form onSubmit={handleSearch} className="space-y-6">
          {/* 查询方式选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              查询方式
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="orderId"
                  checked={searchType === 'orderId'}
                  onChange={(e) => setSearchType(e.target.value as 'orderId')}
                  className="mr-2"
                />
                <span className="text-gray-700 dark:text-gray-300">订单号</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="contact"
                  checked={searchType === 'contact'}
                  onChange={(e) => setSearchType(e.target.value as 'contact')}
                  className="mr-2"
                />
                <span className="text-gray-700 dark:text-gray-300">联系方式</span>
              </label>
            </div>
          </div>

          {/* 输入字段 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchType === 'orderId' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  订单号 *
                </label>
                <input
                  type="text"
                  required
                  placeholder="请输入订单号，如：ORD001"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  联系方式 *
                </label>
                <input
                  type="text"
                  required
                  placeholder="请输入QQ号或邮箱（纯数字将自动添加@qq.com）"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                查询密码 *
              </label>
              <input
                type="password"
                required
                placeholder="请输入购买时设置的查询密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={searching}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <Search className="h-5 w-5" />
            <span>{searching ? '查询中...' : '查询订单'}</span>
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </div>

      {/* 查询结果 */}
      {searchResult && (
        <div className="space-y-6">
          {Array.isArray(searchResult) ? (
            // 多个订单结果
            <>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                找到 {searchResult.length} 个订单
              </h2>
              {searchResult.map((order) => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  verifiedPassword={password || getCachedOrderPassword(order.id) || undefined} 
                />
              ))}
            </>
          ) : (
            // 单个订单结果
            <OrderCard 
              order={searchResult} 
              verifiedPassword={password || getCachedOrderPassword(searchResult.id) || undefined} 
            />
          )}
        </div>
      )}
    </div>
  )
}

// 订单卡片组件
function OrderCard({ order, verifiedPassword }: { order: Order; verifiedPassword?: string }) {
  const [showCardKeys, setShowCardKeys] = useState(false)
  const [cardKeys, setCardKeys] = useState<CardKey[]>([])
  const [loadingCardKeys, setLoadingCardKeys] = useState(false)
  const [queryPassword, setQueryPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [copiedCardKey, setCopiedCardKey] = useState<string | null>(null)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const getContactIcon = (contact: string) => {
    return contact.includes('@') ? <Mail className="h-4 w-4" /> : <Phone className="h-4 w-4" />
  }

  const handleViewCardKeys = async () => {
    // 优先使用已验证的密码，如果没有则要求用户输入
    const passwordToUse = verifiedPassword || queryPassword
    if (!passwordToUse) {
      alert('请输入查询密码')
      return
    }

    setLoadingCardKeys(true)
    try {
      const response = await orderApi.getOrderCardKeys(order.id, passwordToUse)
      if (response.success) {
        setCardKeys(response.data)
        setShowCardKeys(true)
      } else {
        alert('获取卡密失败')
      }
    } catch (error) {
      console.error('获取卡密错误:', error)
      alert('获取卡密失败，请检查查询密码是否正确')
    } finally {
      setLoadingCardKeys(false)
    }
  }

  const copyToClipboard = async (text: string, cardKeyId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCardKey(cardKeyId)
      setTimeout(() => setCopiedCardKey(null), 2000)
    } catch (error) {
      console.error('复制失败:', error)
      alert('复制失败，请手动选择文本复制')
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          订单详情
        </h3>
        <div className="flex space-x-2">
          {/* 检查是否是卡密商品，如果是卡密商品且状态为processing，则不显示"处理中"状态 */}
          {(() => {
            const hasCardKeys = order.items.some(item => item.productType === 'CARD_KEY')
            const isProcessing = order.status === 'processing'
            
            // 如果是卡密商品且状态为processing，跳过显示订单状态
            if (hasCardKeys && isProcessing) {
              return null
            }
            
            return (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusMap[order.status].color}`}>
                {statusMap[order.status].label}
              </span>
            )
          })()}
          {order.paymentStatus && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${paymentStatusMap[order.paymentStatus]?.color || 'text-gray-600 bg-gray-100'}`}>
              {paymentStatusMap[order.paymentStatus]?.label || order.paymentStatus}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">订单号:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {order.id}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {getContactIcon(order.customerContact)}
            <span className="text-sm text-gray-600 dark:text-gray-400">联系方式:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {order.customerContact}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">下单时间:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {formatDate(order.createdAt)}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">订单金额:</span>
            <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">
              ¥{order.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* 付款按钮区域 */}
      {order.paymentStatus === 'pending' && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <CreditCard className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h4 className="text-lg font-medium text-yellow-800 dark:text-yellow-200">
                  订单待付款
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  请完成支付以处理您的订单
                </p>
              </div>
            </div>
            <PaymentButton order={order} />
          </div>
        </div>
      )}

      {/* 商品列表 */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          商品清单
        </h4>
        <div className="space-y-3">
          {order.items.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h5 className="font-medium text-gray-900 dark:text-gray-100">
                    {item.productName}
                  </h5>
                  {item.productType === 'CARD_KEY' && (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                      卡密商品
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  单价: ¥{item.price.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  数量: {item.quantity}
                </p>
                <p className="font-bold text-gray-900 dark:text-gray-100">
                  ¥{(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 卡密查看功能 */}
      {order.hasCardKeys && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-2 mb-4">
            <Key className="h-5 w-5 text-blue-500" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              卡密内容
            </h4>
          </div>
          
          {!showCardKeys ? (
            <div className="space-y-4">
              {verifiedPassword ? (
                // 有已验证密码，直接显示查看按钮
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    该订单包含卡密商品，点击下方按钮查看卡密内容
                  </p>
                  <button
                    onClick={handleViewCardKeys}
                    disabled={loadingCardKeys}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loadingCardKeys ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <Key className="h-4 w-4" />
                    )}
                    <span>{loadingCardKeys ? '获取中...' : '查看卡密'}</span>
                  </button>
                </>
              ) : (
                // 没有已验证密码，需要用户输入
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    该订单包含卡密商品，请输入查询密码查看卡密内容
                  </p>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <input
                        type={passwordVisible ? 'text' : 'password'}
                        value={queryPassword}
                        onChange={(e) => setQueryPassword(e.target.value)}
                        placeholder="请输入查询密码"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onKeyPress={(e) => e.key === 'Enter' && handleViewCardKeys()}
                      />
                      <button
                        type="button"
                        onClick={() => setPasswordVisible(!passwordVisible)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <button
                      onClick={handleViewCardKeys}
                      disabled={loadingCardKeys || !queryPassword}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {loadingCardKeys ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      ) : (
                        <Key className="h-4 w-4" />
                      )}
                      <span>{loadingCardKeys ? '获取中...' : '查看卡密'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-green-600 dark:text-green-400">
                  找到 {cardKeys.length} 个卡密
                </p>
                <button
                  onClick={() => setShowCardKeys(false)}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  隐藏卡密
                </button>
              </div>
              
              <div className="space-y-3">
                {cardKeys.map((cardKey, index) => (
                  <div
                    key={cardKey.id}
                    className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            卡密 #{index + 1}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            cardKey.status === 'SOLD' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }`}>
                            {cardKey.statusDescription}
                          </span>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-3 rounded border font-mono text-sm">
                          {cardKey.cardKey}
                        </div>
                        {cardKey.soldAt && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            发放时间: {formatDate(cardKey.soldAt)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => copyToClipboard(cardKey.cardKey, cardKey.id)}
                        className="ml-4 p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
                        title="复制卡密"
                      >
                        {copiedCardKey === cardKey.id ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Copy className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          最后更新: {formatDate(order.updatedAt)}
        </p>
      </div>
    </div>
  )
}

// 付款按钮组件
function PaymentButton({ order }: { order: Order }) {
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePayment = async () => {
    setProcessing(true)
    setError(null)

    try {
      // 获取当前页面URL作为回调基础
      const baseUrl = window.location.origin
      const successUrl = `${baseUrl}/payment/success?orderId=${order.id}`
      const cancelUrl = `${baseUrl}/orders?orderId=${order.id}`

      // 创建Checkout Session
      const response = await paymentApi.createCheckoutSession({
        orderId: order.id,
        amount: order.totalAmount,
        currency: 'cny',
        successUrl,
        cancelUrl
      })

      if (!response.success) {
        throw new Error('创建支付会话失败')
      }

      // 跳转到Stripe Checkout页面
      window.location.href = response.data.checkoutUrl

    } catch (err) {
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      console.error('创建支付失败:', err)
      setProcessing(false)
    }
  }

  return (
    <div className="flex flex-col items-end space-y-2">
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <button
        onClick={handlePayment}
        disabled={processing}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
      >
        {processing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span>创建支付中...</span>
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4" />
            <span>立即付款</span>
            <ExternalLink className="h-4 w-4" />
          </>
        )}
      </button>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        🔒 安全支付
      </p>
    </div>
  )
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    }>
      <OrdersPageContent />
    </Suspense>
  )
}