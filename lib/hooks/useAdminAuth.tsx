'use client'

import React, { useState, useEffect, createContext, useContext } from 'react'
import { AdminUser } from '@/types'
import { authApi, isApiError } from '@/lib/api'

interface AdminAuthContextType {
  user: AdminUser | null
  isLoading: boolean
  login: (token: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isAuthenticated: boolean
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

interface AdminAuthProviderProps {
  children: React.ReactNode
}

export function AdminAuthProvider({ children }: AdminAuthProviderProps) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedUser = localStorage.getItem('adminUser')
        if (savedUser) {
          const userData = JSON.parse(savedUser)
          setUser(userData)
        }
      } catch (error) {
        console.error('检查认证状态失败:', error)
        localStorage.removeItem('adminUser')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (token: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true)
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
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('adminUser')
  }

  const value: AdminAuthContextType = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user
  }

  return React.createElement(
    AdminAuthContext.Provider,
    { value },
    children
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}