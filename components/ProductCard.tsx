'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Product } from '@/types'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/product/${product.id}`}>
      <div className="product-card-glass rounded-lg overflow-hidden group">
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white text-lg font-semibold">售罄</span>
            </div>
          )}
        </div>
        
        <div className="p-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 leading-tight">
            {product.name}
          </h3>
          
          <div className="space-y-1">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              ¥{product.price.toFixed(2)}
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400">
              库存: {product.stock}
            </div>
            
            {product.stock > 0 && product.stock <= 5 && (
              <div className="text-xs text-orange-500 dark:text-orange-400">
                库存紧张
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}