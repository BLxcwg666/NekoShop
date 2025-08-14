import {
  ApiResponse,
  ApiError,
  Product,
  ProductsResponse,
  Category,
  CategoryRequest,
  CategorySortRequest,
  Order,
  CreateOrderRequest,
  SearchOrderRequest,
  PaymentConfig,
  CreatePaymentIntentRequest,
  PaymentIntentResponse,
  CreateCheckoutSessionRequest,
  CheckoutSessionResponse,
  CardKey,
  CardKeyResponse,
  BatchImportCardKeysRequest,
  BatchImportResult
} from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/v1'

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(url, config)
    
    const data = await response.json()
    
    if (!response.ok) {
      console.error('API请求失败:', {
        status: response.status,
        data
      })
      throw data as ApiError
    }
    
    return data as T
  } catch (error) {
    console.error('API请求错误:', error)
    throw error
  }
}

export const productApi = {
  async getProducts(params?: {
    page?: number
    limit?: number
    categoryId?: string
  }): Promise<ApiResponse<ProductsResponse>> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.categoryId) searchParams.set('categoryId', params.categoryId)
    
    const query = searchParams.toString()
    const endpoint = `/products${query ? `?${query}` : ''}`
    
    return apiRequest<ApiResponse<ProductsResponse>>(endpoint)
  },

  async getProduct(id: string): Promise<ApiResponse<Product>> {
    return apiRequest<ApiResponse<Product>>(`/products/${id}`)
  },

  async getCategories(): Promise<ApiResponse<Category[]>> {
    return apiRequest<ApiResponse<Category[]>>('/products/categories')
  }
}

export const orderApi = {
  async createOrder(data: CreateOrderRequest): Promise<ApiResponse<any>> {
    console.log('发送创建订单请求，数据:', data)
    
    return apiRequest<ApiResponse<any>>('/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json' // 明确设置Content-Type
      },
      body: JSON.stringify(data)
    })
  },

  async getOrder(orderId: string, queryPassword: string): Promise<ApiResponse<Order>> {
    const searchParams = new URLSearchParams({ queryPassword })
    return apiRequest<ApiResponse<Order>>(`/orders/${orderId}?${searchParams}`)
  },

  async getOrderBySessionId(sessionId: string): Promise<ApiResponse<Order>> {
    return apiRequest<ApiResponse<Order>>(`/orders/session/${sessionId}`)
  },

  async searchOrders(data: SearchOrderRequest): Promise<ApiResponse<Order[]>> {
    console.log('发送搜索订单请求，数据:', data)
    
    return apiRequest<ApiResponse<Order[]>>('/orders/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
  },

  async getOrderCardKeys(orderId: string, queryPassword: string): Promise<ApiResponse<CardKey[]>> {
    const searchParams = new URLSearchParams({ queryPassword })
    return apiRequest<ApiResponse<CardKey[]>>(`/orders/${orderId}/card-keys?${searchParams}`)
  }
}

export const authApi = {
  async adminLogin(token: string): Promise<ApiResponse<{ token: string; tokenType: string; role: string }>> {
    return apiRequest<ApiResponse<{ token: string; tokenType: string; role: string }>>('/auth/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    })
  }
}

export const adminApi = {
  async getAllProducts(token: string): Promise<ApiResponse<Product[]>> {
    return apiRequest<ApiResponse<Product[]>>('/admin/products', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  },

  async createProduct(data: any, token: string): Promise<ApiResponse<Product>> {
    console.log('发送创建商品请求，数据:', data)
    
    return apiRequest<ApiResponse<Product>>('/admin/products', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
  },

  async updateProduct(id: string, data: any, token: string): Promise<ApiResponse<Product>> {
    console.log('发送更新商品请求，ID:', id, '数据:', data)
    
    return apiRequest<ApiResponse<Product>>(`/admin/products/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' // 明确设置Content-Type
      },
      body: JSON.stringify(data)
    })
  },

  async deleteProduct(id: string, token: string): Promise<ApiResponse<void>> {
    return apiRequest<ApiResponse<void>>(`/admin/products/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  },

  async getAllOrders(token: string, status?: string): Promise<ApiResponse<Order[]>> {
    const searchParams = new URLSearchParams()
    if (status) searchParams.set('status', status)
    
    const query = searchParams.toString()
    const endpoint = `/admin/orders${query ? `?${query}` : ''}`
    
    return apiRequest<ApiResponse<Order[]>>(endpoint, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  },

  async updateOrderStatus(orderId: string, status: string, token: string): Promise<ApiResponse<any>> {
    console.log('发送更新订单状态请求，订单ID:', orderId, '状态:', status)
    
    return apiRequest<ApiResponse<any>>(`/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    })
  },

  async deleteOrder(orderId: string, token: string): Promise<ApiResponse<void>> {
    return apiRequest<ApiResponse<void>>(`/admin/orders/${orderId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  },

  async getSystemStats(token: string): Promise<ApiResponse<any>> {
    return apiRequest<ApiResponse<any>>('/admin/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  },

  async batchImportCardKeys(data: BatchImportCardKeysRequest, token: string): Promise<ApiResponse<BatchImportResult>> {
    console.log('发送批量导入卡密请求，数据:', data)
    
    return apiRequest<ApiResponse<BatchImportResult>>('/admin/card-keys/batch-import', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
  },

  async getProductCardKeys(
    productId: string, 
    token: string, 
    params?: {
      page?: number
      limit?: number
      status?: string
    }
  ): Promise<ApiResponse<CardKeyResponse>> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.status) searchParams.set('status', params.status)
    
    const query = searchParams.toString()
    const endpoint = `/admin/products/${productId}/card-keys${query ? `?${query}` : ''}`
    
    return apiRequest<ApiResponse<CardKeyResponse>>(endpoint, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  },

  async deleteCardKey(cardKeyId: string, token: string): Promise<ApiResponse<void>> {
    return apiRequest<ApiResponse<void>>(`/admin/card-keys/${cardKeyId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  },

  async getOrderCardKeys(orderId: string, token: string): Promise<ApiResponse<CardKey[]>> {
    return apiRequest<ApiResponse<CardKey[]>>(`/admin/orders/${orderId}/card-keys`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  },

  async getProductCardKeyStats(productId: string, token: string): Promise<ApiResponse<any>> {
    return apiRequest<ApiResponse<any>>(`/admin/products/${productId}/card-keys/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  }
}

export const categoryApi = {
  async getCategories(includeDisabled = false): Promise<ApiResponse<Category[]>> {
    const searchParams = new URLSearchParams()
    if (includeDisabled) searchParams.set('includeDisabled', 'true')
    
    const query = searchParams.toString()
    const endpoint = `/categories${query ? `?${query}` : ''}`
    
    return apiRequest<ApiResponse<Category[]>>(endpoint)
  },

  async getCategory(id: string): Promise<ApiResponse<Category>> {
    return apiRequest<ApiResponse<Category>>(`/categories/${id}`)
  },

  async createCategory(data: CategoryRequest, token: string): Promise<ApiResponse<Category>> {
    return apiRequest<ApiResponse<Category>>('/categories', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
  },

  async updateCategory(id: string, data: CategoryRequest, token: string): Promise<ApiResponse<Category>> {
    return apiRequest<ApiResponse<Category>>(`/categories/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
  },

  async deleteCategory(id: string, token: string): Promise<ApiResponse<void>> {
    return apiRequest<ApiResponse<void>>(`/categories/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  },

  async updateCategoriesOrder(data: CategorySortRequest, token: string): Promise<ApiResponse<void>> {
    return apiRequest<ApiResponse<void>>('/categories/sort', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
  }
}

export function isApiError(error: any): error is ApiError {
  return error && typeof error === 'object' && error.success === false && error.error
}

export const paymentApi = {
  async getConfig(): Promise<ApiResponse<PaymentConfig>> {
    return apiRequest<ApiResponse<PaymentConfig>>('/payments/config')
  },

  async createPaymentIntent(data: CreatePaymentIntentRequest): Promise<ApiResponse<PaymentIntentResponse>> {
    console.log('发送创建支付意图请求，数据:', data)
    
    return apiRequest<ApiResponse<PaymentIntentResponse>>('/payments/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
  },

  async confirmPayment(paymentIntentId: string): Promise<ApiResponse<void>> {
    return apiRequest<ApiResponse<void>>(`/payments/confirm/${paymentIntentId}`, {
      method: 'POST'
    })
  },

  async handlePaymentFailed(paymentIntentId: string, reason?: string): Promise<ApiResponse<void>> {
    const searchParams = new URLSearchParams()
    if (reason) searchParams.set('reason', reason)
    
    const query = searchParams.toString()
    const endpoint = `/payments/failed/${paymentIntentId}${query ? `?${query}` : ''}`
    
    return apiRequest<ApiResponse<void>>(endpoint, {
      method: 'POST'
    })
  },

  async createCheckoutSession(data: CreateCheckoutSessionRequest): Promise<ApiResponse<CheckoutSessionResponse>> {
    console.log('发送创建Checkout Session请求，数据:', data)
    
    return apiRequest<ApiResponse<CheckoutSessionResponse>>('/payments/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json' // 明确设置Content-Type
      },
      body: JSON.stringify(data)
    })
  }
}

export function getErrorMessage(error: any): string {
  if (isApiError(error)) {
    return error.error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return '发生未知错误'
}