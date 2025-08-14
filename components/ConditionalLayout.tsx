'use client'

import { usePathname } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  
  return (
    <div className="min-h-screen bg-neko-pattern text-gray-900 dark:text-gray-100 flex flex-col relative">
      <Header />
      <main className="container mx-auto px-4 py-8 flex-1 relative z-20">
        {children}
      </main>
      <Footer />
    </div>
  )
}