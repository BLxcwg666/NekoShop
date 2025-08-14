import { Order } from '@/types'

const CACHE_KEY = 'nekoshop_cached_orders'
const CACHE_EXPIRY_DAYS = 7

export interface CachedOrder {
  order: Order
  cachedAt: string
  queryPassword: string
}

const encodePassword = (password: string): string => {
  return btoa(unescape(encodeURIComponent(password)))
}

const decodePassword = (encoded: string): string => {
  return decodeURIComponent(escape(atob(encoded)))
}

const isCacheExpired = (cachedAt: string): boolean => {
  const cacheTime = new Date(cachedAt)
  const expiryTime = new Date(cacheTime.getTime() + CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
  return new Date() > expiryTime
}

export const getCachedOrders = (): CachedOrder[] => {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return []
    
    const orders: CachedOrder[] = JSON.parse(cached)
    
    const validOrders = orders.filter(cachedOrder => !isCacheExpired(cachedOrder.cachedAt))
    
    if (validOrders.length !== orders.length) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(validOrders))
    }
    
    return validOrders.sort((a, b) => new Date(b.cachedAt).getTime() - new Date(a.cachedAt).getTime())
  } catch (error) {
    console.error('获取缓存订单失败:', error)
    return []
  }
}

export const addOrderToCache = (order: Order, queryPassword: string): void => {
  try {
    const cachedOrders = getCachedOrders()
    
    const existingIndex = cachedOrders.findIndex(cached => cached.order.id === order.id)
    
    const newCachedOrder: CachedOrder = {
      order,
      cachedAt: new Date().toISOString(),
      queryPassword: encodePassword(queryPassword)
    }
    
    if (existingIndex >= 0) {
      cachedOrders[existingIndex] = newCachedOrder
    } else {
      cachedOrders.unshift(newCachedOrder)
    }
    
    const limitedOrders = cachedOrders.slice(0, 10)
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(limitedOrders))
  } catch (error) {
    console.error('缓存订单失败:', error)
  }
}

export const removeOrderFromCache = (orderId: string): void => {
  try {
    const cachedOrders = getCachedOrders()
    const filteredOrders = cachedOrders.filter(cached => cached.order.id !== orderId)
    localStorage.setItem(CACHE_KEY, JSON.stringify(filteredOrders))
  } catch (error) {
    console.error('移除缓存订单失败:', error)
  }
}

export const clearOrderCache = (): void => {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch (error) {
    console.error('清空订单缓存失败:', error)
  }
}

export const getCachedOrderPassword = (orderId: string): string | null => {
  try {
    const cachedOrders = getCachedOrders()
    const cachedOrder = cachedOrders.find(cached => cached.order.id === orderId)
    return cachedOrder ? decodePassword(cachedOrder.queryPassword) : null
  } catch (error) {
    console.error('获取缓存密码失败:', error)
    return null
  }
}

export const getCacheStats = () => {
  const cachedOrders = getCachedOrders()
  return {
    count: cachedOrders.length,
    oldestCache: cachedOrders.length > 0 ? cachedOrders[cachedOrders.length - 1].cachedAt : null,
    newestCache: cachedOrders.length > 0 ? cachedOrders[0].cachedAt : null
  }
}