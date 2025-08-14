'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAdminAuth } from '@/lib/hooks/useAdminAuth'
import { adminApi, isApiError } from '@/lib/api'
import { Product, CardKey, CardKeyResponse, BatchImportCardKeysRequest, BatchImportResult } from '@/types'
import { 
  Upload, 
  Trash2, 
  Search, 
  AlertTriangle,
  RefreshCw,
  X,
  Plus,
  FileText,
  BarChart3,
  ArrowLeft,
  Key
} from 'lucide-react'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  productId: string
  onImportSuccess: () => void
  token: string
}

function ImportModal({ isOpen, onClose, productId, onImportSuccess, token }: ImportModalProps) {
  const [cardKeysText, setCardKeysText] = useState('')
  const [remark, setRemark] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<BatchImportResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setResult(null)

    try {
      const cardKeys = cardKeysText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)

      if (cardKeys.length === 0) {
        setError('请输入卡密内容')
        return
      }

      const request: BatchImportCardKeysRequest = {
        productId,
        cardKeys,
        remark: remark.trim() || undefined
      }

      const response = await adminApi.batchImportCardKeys(request, token)

      if (response.success) {
        setResult(response.data)
        if (response.data.failureCount === 0) {
          setTimeout(() => {
            onImportSuccess()
            onClose()
          }, 2000)
        }
      } else {
        setError('导入失败')
      }
    } catch (err) {
      console.error('导入卡密错误:', err)
      const errorMessage = isApiError(err) ? err.error.message : '导入失败'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setCardKeysText('')
    setRemark('')
    setError('')
    setResult(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleClose} />
        <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              批量导入卡密
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {result ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${
                result.failureCount === 0 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                  : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
              }`}>
                <h3 className="font-semibold mb-2">导入结果</h3>
                <p>{result.message}</p>
                <div className="mt-2 text-sm">
                  <p>总数: {result.totalCount}</p>
                  <p>成功: {result.successCount}</p>
                  <p>失败: {result.failureCount}</p>
                </div>
              </div>

              {result.duplicateCardKeys.length > 0 && (
                <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                  <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-2">
                    重复的卡密 ({result.duplicateCardKeys.length})
                  </h4>
                  <div className="text-sm text-orange-700 dark:text-orange-300 max-h-32 overflow-y-auto">
                    {result.duplicateCardKeys.map((key, index) => (
                      <div key={index}>{key}</div>
                    ))}
                  </div>
                </div>
              )}

              {result.failedCardKeys.length > 0 && (
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                    失败的卡密 ({result.failedCardKeys.length})
                  </h4>
                  <div className="text-sm text-red-700 dark:text-red-300 max-h-32 overflow-y-auto">
                    {result.failedCardKeys.map((key, index) => (
                      <div key={index}>{key}</div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                {result.failureCount > 0 && (
                  <button
                    onClick={() => setResult(null)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    重新导入
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  完成
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  卡密内容（每行一个）
                </label>
                <textarea
                  value={cardKeysText}
                  onChange={(e) => setCardKeysText(e.target.value)}
                  rows={10}
                  placeholder="请输入卡密，每行一个&#10;例如：&#10;GAME-ABCD-1234-EFGH&#10;GAME-IJKL-5678-MNOP&#10;GAME-QRST-9012-UVWX"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {cardKeysText.split('\n').filter(line => line.trim().length > 0).length} 个卡密
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  备注（可选）
                </label>
                <input
                  type="text"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="例如：第一批游戏激活码"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {error && (
                <div className="text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>{isLoading ? '导入中...' : '导入'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CardKeysPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.productId as string
  const { user } = useAdminAuth()

  const [product, setProduct] = useState<Product | null>(null)
  const [cardKeys, setCardKeys] = useState<CardKey[]>([])
  const [filteredCardKeys, setFilteredCardKeys] = useState<CardKey[]>([])
  const [stats, setStats] = useState<Record<string, number>>({})
  const [pagination, setPagination] = useState({
    current: 1,
    total: 0,
    hasNext: false,
    hasPrev: false
  })

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  const loadCardKeys = async (page = 1) => {
    if (!user?.token) return

    try {
      setIsLoading(true)
      setError('')
      
      const response = await adminApi.getProductCardKeys(
        productId, 
        user.token, 
        { 
          page, 
          limit: 20, 
          status: statusFilter || undefined 
        }
      )

      if (response.success) {
        setCardKeys(response.data.cardKeys)
        setFilteredCardKeys(response.data.cardKeys)
        setStats(response.data.stats)
        setPagination(response.data.pagination)
      } else {
        setError('获取卡密列表失败')
      }
    } catch (err) {
      console.error('获取卡密列表错误:', err)
      const errorMessage = isApiError(err) ? err.error.message : '获取卡密列表失败'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const loadProduct = async () => {
    if (!user?.token) return

    try {
      const response = await adminApi.getAllProducts(user.token)
      if (response.success) {
        const foundProduct = response.data.find(p => p.id === productId)
        if (foundProduct) {
          setProduct(foundProduct)
        } else {
          setError('商品不存在')
        }
      }
    } catch (err) {
      console.error('获取商品信息错误:', err)
      setError('获取商品信息失败')
    }
  }

  useEffect(() => {
    if (user?.token) {
      loadProduct()
      loadCardKeys()
    }
  }, [user?.token, productId, statusFilter])

  useEffect(() => {
    const filtered = cardKeys.filter(cardKey => 
      cardKey.cardKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cardKey.orderId && cardKey.orderId.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    setFilteredCardKeys(filtered)
  }, [searchTerm, cardKeys])

  const handleDeleteCardKey = async (cardKeyId: string) => {
    if (!user?.token) return
    
    if (!confirm('确定要删除这个卡密吗？此操作不可撤销。')) {
      return
    }

    try {
      const response = await adminApi.deleteCardKey(cardKeyId, user.token)
      if (response.success) {
        loadCardKeys(pagination.current)
      } else {
        alert('删除失败')
      }
    } catch (err) {
      console.error('删除卡密错误:', err)
      const errorMessage = isApiError(err) ? err.error.message : '删除失败'
      alert(errorMessage)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'SOLD':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      case 'RESERVED':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  if (isLoading && !product) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>加载中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回</span>
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <Key className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                卡密管理
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {product ? `${product.name} 的卡密管理` : '加载中...'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => loadCardKeys(pagination.current)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4" />
            <span>刷新</span>
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          >
            <Plus className="w-4 h-4" />
            <span>批量导入</span>
          </button>
        </div>
      </div>

      {/* 统计信息 */}
      {Object.keys(stats).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(stats).map(([status, count]) => (
            <div key={status} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{status}</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{count}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 搜索和筛选 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="搜索卡密内容或订单号..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">全部状态</option>
            <option value="AVAILABLE">可用</option>
            <option value="SOLD">已售出</option>
            <option value="RESERVED">已预留</option>
            <option value="EXPIRED">已过期</option>
          </select>
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

      {/* 卡密列表 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              卡密列表
            </h2>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              共 {filteredCardKeys.length} 个卡密
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 text-center">
            <RefreshCw className="mx-auto w-8 h-8 animate-spin text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">加载卡密列表中...</p>
          </div>
        ) : filteredCardKeys.length === 0 ? (
          <div className="p-6 text-center">
            <Key className="mx-auto w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter ? '没有找到匹配的卡密' : '暂无卡密'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    卡密内容
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    订单号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {filteredCardKeys.map((cardKey) => (
                  <tr key={cardKey.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="text-sm font-mono text-gray-900 dark:text-white">
                        {cardKey.cardKey}
                      </div>
                      {cardKey.remark && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {cardKey.remark}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(cardKey.status)}`}>
                        {cardKey.statusDescription}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {cardKey.orderId || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(cardKey.createdAt).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4">
                      {cardKey.status === 'AVAILABLE' && (
                        <button
                          onClick={() => handleDeleteCardKey(cardKey.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 分页 */}
      {pagination.total > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => loadCardKeys(pagination.current - 1)}
            disabled={!pagination.hasPrev}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>上一页</span>
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            第 {pagination.current} 页，共 {pagination.total} 页
          </span>
          <button
            onClick={() => loadCardKeys(pagination.current + 1)}
            disabled={!pagination.hasNext}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>下一页</span>
          </button>
        </div>
      )}

      {/* 导入模态框 */}
      {user?.token && (
        <ImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          productId={productId}
          onImportSuccess={() => loadCardKeys(pagination.current)}
          token={user.token}
        />
      )}
    </div>
  )
}