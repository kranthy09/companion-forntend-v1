// src/components/layout/app-layout.tsx
'use client'
import { useState, ReactNode } from 'react'
import { useAuthContext } from '@/components/providers/auth-provider'
import { Sidebar } from './sidebar'
import { Header } from './header'

interface AppLayoutProps {
    children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
    const { isAuthenticated, loading } = useAuthContext()
    const [sidebarOpen, setSidebarOpen] = useState(true)

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return <div className="min-h-screen bg-gray-50">{children}</div>
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

            <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'
                }`}>
                <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

                <main className="flex-1 p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}