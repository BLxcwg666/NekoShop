import { useState, useCallback } from 'react'
import { getErrorMessage, isApiError } from '@/lib/api'

export interface UseErrorHandlerReturn {
  error: string | null
  setError: (error: string | null) => void
  handleError: (error: any) => void
  clearError: () => void
  hasError: boolean
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setError] = useState<string | null>(null)

  const handleError = useCallback((err: any) => {
    console.error('Error caught by useErrorHandler:', err)
    
    if (isApiError(err)) {
      setError(err.error.message)
    } else if (err instanceof Error) {
      setError(err.message)
    } else if (typeof err === 'string') {
      setError(err)
    } else {
      setError('发生未知错误，请稍后重试')
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    error,
    setError,
    handleError,
    clearError,
    hasError: error !== null
  }
}

export function useAsyncOperation<T>() {
  const [loading, setLoading] = useState(false)
  const { error, handleError, clearError } = useErrorHandler()

  const execute = useCallback(async (
    operation: () => Promise<T>,
    onSuccess?: (result: T) => void,
    onError?: (error: any) => void
  ) => {
    try {
      setLoading(true)
      clearError()
      
      const result = await operation()
      
      if (onSuccess) {
        onSuccess(result)
      }
      
      return result
    } catch (err) {
      handleError(err)
      if (onError) {
        onError(err)
      }
      throw err
    } finally {
      setLoading(false)
    }
  }, [handleError, clearError])

  return {
    loading,
    error,
    execute,
    clearError,
    hasError: error !== null
  }
}