'use client'

import { useState, useEffect } from 'react'
import { ProductCard } from '@/components/ProductCard'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Product, Category } from '@/types'
import { productApi, categoryApi, getErrorMessage } from '@/lib/api'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface CategoryWithProducts {
  category: Category
  products: Product[]
  isExpanded: boolean
}

export default function HomePage() {
  const [categorizedProducts, setCategorizedProducts] = useState<CategoryWithProducts[]>([])
  const [uncategorizedProducts, setUncategorizedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // 获取分类列表
        const categoriesResponse = await categoryApi.getCategories()
        if (!categoriesResponse.success) {
          throw new Error('获取分类列表失败')
        }
        
        // 只显示启用的分类
        const enabledCategories = categoriesResponse.data.filter(cat => cat.enabled)
        
        // 获取所有商品
        const productsResponse = await productApi.getProducts({
          page: 1,
          limit: 100 // 获取更多商品
        })
        
        if (!productsResponse.success) {
          throw new Error('获取商品列表失败')
        }
        
        const allProducts = productsResponse.data.products
        
        // 按分类分组商品
        const categoryGroups: CategoryWithProducts[] = enabledCategories.map((category, index) => ({
          category,
          products: allProducts.filter(product => product.category?.id === category.id),
          isExpanded: index === 0 // 默认展开第一个分类
        }))
        
        // 过滤掉没有商品的分类
        const nonEmptyCategoryGroups = categoryGroups.filter(group => group.products.length > 0)
        setCategorizedProducts(nonEmptyCategoryGroups)
        
        // 未分类的商品
        const uncategorized = allProducts.filter(product => !product.category)
        setUncategorizedProducts(uncategorized)
        
      } catch (err) {
        setError(getErrorMessage(err))
        console.error('获取数据失败:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            欢迎来到 libxcnya.soの杂货铺
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            喵！ ✨
          </p>
        </div>
        
        <div className="text-center py-12">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md mx-auto">
            <p className="text-red-600 dark:text-red-400 text-lg mb-4">
              获取商品列表失败
            </p>
            <p className="text-red-500 dark:text-red-300 text-sm mb-4">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              重新加载
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          欢迎来到 libxcnya.soの杂货铺
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          喵~ ✨
        </p>
        
        {(categorizedProducts.length > 0 || uncategorizedProducts.length > 0) && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            共 {categorizedProducts.length} 个分类，{categorizedProducts.reduce((sum, group) => sum + group.products.length, 0) + uncategorizedProducts.length} 个商品
          </p>
        )}
      </div>

      {categorizedProducts.length === 0 && uncategorizedProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            暂时没有商品，请稍后再来看看～
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* 分类商品 */}
          {categorizedProducts.map((categoryGroup, index) => (
            <div key={categoryGroup.category.id} className="category-card">
              <CategorySection
                categoryGroup={categoryGroup}
                onToggle={() => {
                  const updated = [...categorizedProducts]
                  updated[index].isExpanded = !updated[index].isExpanded
                  setCategorizedProducts(updated)
                }}
              />
            </div>
          ))}
          
          {/* 未分类商品 */}
          {uncategorizedProducts.length > 0 && (
            <div className="category-card relative overflow-hidden rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 p-6">
              {/* 渐变背景 */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/70 to-white/50 dark:from-gray-800/90 dark:via-gray-800/70 dark:to-gray-800/50"></div>
              
              <div className="relative">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  其他商品
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  未分类的商品 • {uncategorizedProducts.length} 个商品
                </p>
                
                {/* 分割线 */}
                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-600 to-transparent mb-6"></div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {uncategorizedProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className="transform transition-all duration-300"
                      style={{
                        animationDelay: `${index * 50}ms`
                      }}
                    >
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 装饰性底部渐变 */}
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-gray-500/10 to-transparent"></div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// 分类展示组件
interface CategorySectionProps {
  categoryGroup: CategoryWithProducts
  onToggle: () => void
}

function CategorySection({ categoryGroup, onToggle }: CategorySectionProps) {
  const { category, products, isExpanded } = categoryGroup
  
  return (
    <div className="relative overflow-hidden rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
      {/* 渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/70 to-white/50 dark:from-gray-800/90 dark:via-gray-800/70 dark:to-gray-800/50"></div>
      
      {/* 分类标题 */}
      <div 
        className="relative flex items-center justify-between p-6 cursor-pointer hover:bg-white/50 dark:hover:bg-gray-700/30 transition-all duration-300 group"
        onClick={onToggle}
      >
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
            {category.name}
          </h2>
          {category.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-300">
              {category.description}
            </p>
          )}
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1 font-medium">
            {products.length} 个商品
          </p>
        </div>
        <div className="flex-shrink-0">
          <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
            <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
          </div>
        </div>
      </div>
      
      {/* 商品网格 - 带展开动画 */}
      <div 
        className={`relative overflow-hidden transition-all duration-500 ease-in-out ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 pb-6">
          {/* 分割线 */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-600 to-transparent mb-6"></div>
          
          {/* 商品网格 */}
          <div 
            className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 transform transition-all duration-500 ${
              isExpanded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
            style={{
              transitionDelay: isExpanded ? '200ms' : '0ms'
            }}
          >
            {products.map((product, index) => (
              <div
                key={product.id}
                className="transform transition-all duration-300"
                style={{
                  animationDelay: isExpanded ? `${index * 50}ms` : '0ms'
                }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* 装饰性底部渐变 */}
      {isExpanded && (
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-blue-500/10 to-transparent"></div>
      )}
    </div>
  )
}