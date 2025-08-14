export interface PurchaseRecord {
  orderId: string
  customerContact: string
  queryPassword: string
  purchaseTime: string
  productName: string
  totalAmount: number
}

const CACHE_KEY = 'nekoshop_purchase_records'
const CACHE_EXPIRY_DAYS = 30

const encodePassword = (password: string): string => {
  return btoa(unescape(encodeURIComponent(password)))
}

const decodePassword = (encoded: string): string => {
  return decodeURIComponent(escape(atob(encoded)))
}

const isCacheExpired = (purchaseTime: string): boolean => {
  const purchaseDate = new Date(purchaseTime)
  const expiryTime = new Date(purchaseDate.getTime() + CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
  return new Date() > expiryTime
}

export const getPurchaseRecords = (): PurchaseRecord[] => {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return []
    
    const records: PurchaseRecord[] = JSON.parse(cached)
    
    const validRecords = records.filter(record => !isCacheExpired(record.purchaseTime))
    
    if (validRecords.length !== records.length) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(validRecords))
    }
    
    return validRecords.sort((a, b) => new Date(b.purchaseTime).getTime() - new Date(a.purchaseTime).getTime())
  } catch (error) {
    console.error('获取购买记录失败:', error)
    return []
  }
}

export const addPurchaseRecord = (record: Omit<PurchaseRecord, 'purchaseTime'>): void => {
  try {
    const records = getPurchaseRecords()
    
    const existingIndex = records.findIndex(r => r.orderId === record.orderId)
    
    const newRecord: PurchaseRecord = {
      ...record,
      purchaseTime: new Date().toISOString(),
      queryPassword: encodePassword(record.queryPassword)
    }
    
    if (existingIndex >= 0) {
      records[existingIndex] = newRecord
    } else {
      records.unshift(newRecord)
    }
    
    const limitedRecords = records.slice(0, 20)
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(limitedRecords))
  } catch (error) {
    console.error('保存购买记录失败:', error)
  }
}

export const getLatestPurchaseRecord = (): PurchaseRecord | null => {
  const records = getPurchaseRecords()
  return records.length > 0 ? records[0] : null
}

export const getPurchaseRecordByOrderId = (orderId: string): PurchaseRecord | null => {
  const records = getPurchaseRecords()
  const record = records.find(r => r.orderId === orderId)
  
  if (record) {
    return {
      ...record,
      queryPassword: decodePassword(record.queryPassword)
    }
  }
  
  return null
}

export const clearPurchaseRecords = (): void => {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch (error) {
    console.error('清空购买记录失败:', error)
  }
}

export const removePurchaseRecord = (orderId: string): void => {
  try {
    const records = getPurchaseRecords()
    const filteredRecords = records.filter(r => r.orderId !== orderId)
    localStorage.setItem(CACHE_KEY, JSON.stringify(filteredRecords))
  } catch (error) {
    console.error('删除购买记录失败:', error)
  }
}

export const getPurchaseStats = () => {
  const records = getPurchaseRecords()
  return {
    count: records.length,
    totalAmount: records.reduce((sum, record) => sum + record.totalAmount, 0),
    oldestPurchase: records.length > 0 ? records[records.length - 1].purchaseTime : null,
    newestPurchase: records.length > 0 ? records[0].purchaseTime : null
  }
}