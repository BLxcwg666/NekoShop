'use client'

import { useState, useEffect } from 'react'
import { useAdminAuth } from '@/lib/hooks/useAdminAuth'
import { categoryApi } from '@/lib/api'
import { Category, CategoryRequest } from '@/types'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  GripVertical,
  Eye,
  EyeOff
} from 'lucide-react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

export default function CategoriesPage() {
  const { user } = useAdminAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [includeDisabled, setIncludeDisabled] = useState(true)
  const [isDragEnabled, setIsDragEnabled] = useState(false) // 初始为false
  const [isClient, setIsClient] = useState(false) // 客户端标识

  const [formData, setFormData] = useState<CategoryRequest>({
    name: '',
    description: '',
    enabled: true
  })

  const loadCategories = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await categoryApi.getCategories(includeDisabled)
      if (response.success) {
        setCategories(response.data)
        console.log('Categories loaded:', response.data.length)
      }
    } catch (err: any) {
      setError(err.error?.message || '加载分类失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [includeDisabled])

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient && !loading && categories.length > 0) {
      const timer = setTimeout(() => {
        setIsDragEnabled(true)
        console.log('Drag enabled - client:', isClient, 'loading:', loading, 'categories:', categories.length)
        console.log('Categories IDs:', categories.map(c => `category-${c.id}`))
      }, 300)
      
      return () => clearTimeout(timer)
    } else {
      setIsDragEnabled(false)
      console.log('Drag disabled - client:', isClient, 'loading:', loading, 'categories:', categories.length)
    }
  }, [isClient, loading, categories.length])

  const handleCreate = async () => {
    if (!user?.token || !formData.name.trim()) return

    try {
      const response = await categoryApi.createCategory(formData, user.token)
      if (response.success) {
        await loadCategories()
        setShowCreateForm(false)
        setFormData({ name: '', description: '', enabled: true })
      }
    } catch (err: any) {
      setError(err.error?.message || '创建分类失败')
    }
  }

  const handleUpdate = async () => {
    if (!user?.token || !editingCategory || !formData.name.trim()) return

    try {
      const response = await categoryApi.updateCategory(editingCategory.id, formData, user.token)
      if (response.success) {
        await loadCategories()
        setEditingCategory(null)
        setFormData({ name: '', description: '', enabled: true })
      }
    } catch (err: any) {
      setError(err.error?.message || '更新分类失败')
    }
  }

  const handleDelete = async (id: string) => {
    if (!user?.token || !confirm('确定要删除这个分类吗？')) return

    try {
      await categoryApi.deleteCategory(id, user.token)
      await loadCategories()
    } catch (err: any) {
      setError(err.error?.message || '删除分类失败')
    }
  }

  const startEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      enabled: category.enabled
    })
    setShowCreateForm(false)
  }

  const cancelEdit = () => {
    setEditingCategory(null)
    setShowCreateForm(false)
    setFormData({ name: '', description: '', enabled: true })
  }

  const handleDragEnd = async (result: DropResult) => {
    console.log('Drag end:', result)
    
    if (!result.destination || !user?.token) {
      console.log('Drag cancelled or no token')
      return
    }

    const sourceIndex = result.source.index
    const destinationIndex = result.destination.index
    
    if (sourceIndex === destinationIndex) {
      console.log('Same position, no change needed')
      return
    }

    const items = Array.from(categories)
    const [reorderedItem] = items.splice(sourceIndex, 1)
    items.splice(destinationIndex, 0, reorderedItem)

    console.log('Reordering from', sourceIndex, 'to', destinationIndex)
    
    setCategories(items)

    try {
      const categoryIds = items.map(item => item.id)
      console.log('Sending new order:', categoryIds)
      await categoryApi.updateCategoriesOrder({ categoryIds }, user.token)
    } catch (err: any) {
      console.error('Update order failed:', err)
      setError(err.error?.message || '更新排序失败')
      await loadCategories()
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            分类管理
          </h1>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={includeDisabled}
                onChange={(e) => setIncludeDisabled(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span>显示已禁用分类</span>
            </label>
            <button
              onClick={() => {
                setShowCreateForm(true)
                setEditingCategory(null)
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>添加分类</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* 创建/编辑表单 */}
        {(showCreateForm || editingCategory) && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
            <h3 className="text-lg font-medium mb-4">
              {editingCategory ? '编辑分类' : '创建分类'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">分类名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                  placeholder="请输入分类名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">状态</label>
                <select
                  value={formData.enabled ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.value === 'true' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                >
                  <option value="true">启用</option>
                  <option value="false">禁用</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                  rows={3}
                  placeholder="请输入分类描述（可选）"
                />
              </div>
            </div>
            <div className="flex items-center space-x-3 mt-4">
              <button
                onClick={editingCategory ? handleUpdate : handleCreate}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{editingCategory ? '更新' : '创建'}</span>
              </button>
              <button
                onClick={cancelEdit}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>取消</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 分类列表 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium">分类列表</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            <span className="inline-flex items-center">
              <GripVertical className="w-4 h-4 mr-1" />
              拖拽分类可以调整排序，排序靠前的分类会优先显示
            </span>
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">暂无分类</p>
          </div>
        ) : (
          // 始终渲染拖拽列表，但通过禁用来控制
          <DragDropContext onDragEnd={isDragEnabled && isClient ? handleDragEnd : () => {}}>
            <Droppable droppableId="categories-list" isDropDisabled={!isDragEnabled || !isClient}>
              {(provided, snapshot) => (
                <div 
                  {...provided.droppableProps} 
                  ref={provided.innerRef}
                  style={{
                    backgroundColor: snapshot.isDraggingOver && isDragEnabled ? '#f3f4f6' : undefined,
                    transition: 'background-color 0.2s ease',
                    minHeight: '20px'
                  }}
                >
                {categories.map((category, index) => {
                  const draggableId = `category-${category.id}`
                  
                  return (
                    <Draggable 
                      key={draggableId} 
                      draggableId={draggableId} 
                      index={index}
                      isDragDisabled={!isDragEnabled || !isClient}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 transition-all duration-200 ${
                            snapshot.isDragging && isDragEnabled
                              ? 'bg-blue-50 dark:bg-blue-900/20 shadow-lg scale-105 z-50' 
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }`}
                          style={{
                            ...provided.draggableProps.style,
                            transform: snapshot.isDragging && isDragEnabled
                              ? `${provided.draggableProps.style?.transform} rotate(3deg)`
                              : provided.draggableProps.style?.transform
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div 
                                {...(isDragEnabled && isClient ? provided.dragHandleProps : {})} 
                                className={`p-1 rounded transition-colors ${
                                  isDragEnabled && isClient 
                                    ? 'cursor-grab hover:cursor-grabbing hover:bg-gray-200 dark:hover:bg-gray-600' 
                                    : 'cursor-not-allowed opacity-30'
                                }`}
                                title={isDragEnabled && isClient ? "拖拽排序" : "拖拽未启用"}
                              >
                                <GripVertical className={`w-5 h-5 transition-colors ${
                                  isDragEnabled && isClient 
                                    ? 'text-gray-400 hover:text-gray-600' 
                                    : 'text-gray-300'
                                }`} />
                              </div>
                              <div className="flex items-center space-x-3">
                                {category.enabled ? (
                                  <Eye className="w-4 h-4 text-green-500" />
                                ) : (
                                  <EyeOff className="w-4 h-4 text-gray-400" />
                                )}
                                <div>
                                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                    {category.name}
                                  </h3>
                                  {category.description && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      {category.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                排序: {category.sortOrder}
                              </span>
                              {!isDragEnabled && isClient && (
                                <span className="text-xs text-amber-600 dark:text-amber-400">
                                  正在启用拖拽...
                                </span>
                              )}
                              <button
                                onClick={() => startEdit(category)}
                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                disabled={snapshot.isDragging}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(category.id)}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                disabled={snapshot.isDragging}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  )
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        )}
      </div>
    </div>
  )
}