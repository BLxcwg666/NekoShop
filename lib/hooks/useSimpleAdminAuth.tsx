'use client'

import React, { useState, createContext, useContext } from 'react'
import { AdminUser } from '@/types'
import { authApi, isApiError } from '@/lib/api'

interface SimpleAdminAuthContextType {
  user: AdminUser | null
  login: (token: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isAuthenticated: boolean
}

const SimpleAdminAuthContext = createContext<SimpleAdminAuthContextType | undefined>(undefined)

interface SimpleAdminAuthProviderProps {
  children: React.ReactNode
}

export function SimpleAdminAuthProvider({ children }: SimpleAdminAuthProviderProps) {
  const [user, setUser] = useState<AdminUser | null>(null)

  const login = async (token: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authApi.adminLogin(token)
      
      if (response.success) {
        const userData: AdminUser = {
          username: 'admin',
          role: response.data.role,
          token: response.data.token
        }
        
        setUser(userData)
        localStorage.setItem('adminUser', JSON.stringify(userData))
        
        return { success: true }
      } else {
        return { success: false, error: '登录失败' }
      }
    } catch (error) {
      console.error('登录错误:', error)
      const errorMessage = isApiError(error) ? error.error.message : '登录失败，请检查网络连接'
      return { success: false, error: errorMessage }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('adminUser')
  }

  const value: SimpleAdminAuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user
  }

  return (
    <SimpleAdminAuthContext.Provider value={value}>
      {children}
    </SimpleAdminAuthContext.Provider>
  )
}

export function useSimpleAdminAuth() {
  const context = useContext(SimpleAdminAuthContext)
  if (context === undefined) {
    throw new Error('useSimpleAdminAuth must be used within a SimpleAdminAuthProvider')
  }
  return context
}