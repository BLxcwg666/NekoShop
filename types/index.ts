export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
  }
}

export interface Category {
  id: string
  name: string
  description?: string
  sortOrder: number
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface CategoryRequest {
  name: string
  description?: string
  sortOrder?: number
  enabled?: boolean
}

export interface CategorySortRequest {
  categoryIds: string[]
}

export interface Product {
  id: string
  name: string
  price: number
  stock: number
  image: string
  description: string
  category?: Category
  productType: 'NORMAL' | 'CARD_KEY'
  specifications?: Record<string, string>
  createdAt: string
  updatedAt: string
}

export interface ProductsResponse {
  products: Product[]
  pagination: {
    current: number
    total: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  price: number
  productType?: 'NORMAL' | 'CARD_KEY'
}

export interface Order {
  id: string
  customerContact: string
  items: OrderItem[]
  totalAmount: number
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  paymentStatus?: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'refunded'
  hasCardKeys?: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateOrderRequest {
  productId: string
  quantity: number
  customerContact: string
  queryPassword: string
}

export interface SearchOrderRequest {
  customerContact: string
  queryPassword: string
}

export interface PurchaseForm {
  customerContact: string
  quantity: number
  queryPassword: string
}

export interface PaymentConfig {
  publicKey: string
  currency: string
}

export interface CreatePaymentIntentRequest {
  orderId: string
  amount: number
  currency: string
}

export interface PaymentIntentResponse {
  paymentIntentId: string
  clientSecret: string
  status: string
  amount: number
  currency: string
  orderId: string
}

export interface PaymentResult {
  success: boolean
  paymentIntentId?: string
  error?: string
}

export interface CreateCheckoutSessionRequest {
  orderId: string
  amount: number
  currency: string
  successUrl?: string
  cancelUrl?: string
}

export interface CheckoutSessionResponse {
  sessionId: string
  checkoutUrl: string
  orderId: string
}

export interface AdminAuthRequest {
  token: string
}

export interface AdminAuthResponse {
  token: string
  tokenType: string
  role: string
}

export interface AdminUser {
  username: string
  role: string
  token: string
}

export interface UpdateProductRequest {
  name?: string
  price?: number
  stock?: number
  image?: string
  description?: string
  categoryId?: string
  productType?: 'NORMAL' | 'CARD_KEY'
  specifications?: Record<string, string>
}

export interface UpdateOrderStatusRequest {
  status: string
}

export interface SystemStats {
  totalOrders: number
  totalProducts: number
  ordersByStatus: Record<string, number>
  lowStockProducts: number
}

export interface AdminOrder extends Order {
  paymentMethod?: string
  items: OrderItem[]
}

export interface CardKey {
  id: string
  productId: string
  productName?: string
  cardKey: string
  status: 'AVAILABLE' | 'SOLD' | 'RESERVED' | 'EXPIRED'
  statusDescription: string
  orderId?: string
  userId?: string
  remark?: string
  createdAt: string
  updatedAt: string
  soldAt?: string
}

export interface CardKeyResponse {
  cardKeys: CardKey[]
  pagination: {
    current: number
    total: number
    hasNext: boolean
    hasPrev: boolean
  }
  stats: Record<string, number>
}

export interface BatchImportCardKeysRequest {
  productId: string
  cardKeys: string[]
  remark?: string
}

export interface BatchImportResult {
  totalCount: number
  successCount: number
  failureCount: number
  failedCardKeys: string[]
  duplicateCardKeys: string[]
  message: string
}