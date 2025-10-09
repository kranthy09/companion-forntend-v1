// src/components/layout/sidebar.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, FileText, Settings, ChevronLeft, ChevronRight, FileEditIcon, MessageSquare } from 'lucide-react'

interface SidebarProps {
    isOpen: boolean
    onToggle: () => void
}

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Notes', href: '/notes', icon: FileText },
    { name: 'Blogs', href: '/blog', icon: FileEditIcon },
    { name: 'MCP Chat', href: '/mcp', icon: MessageSquare }


]

const bottomNavigation = [
    { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
    const pathname = usePathname()

    return (
        <aside className={cn(
            'fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-20',
            isOpen ? 'w-64' : 'w-16'
        )}>
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
                {isOpen && (
                    <h1 className="text-xl font-bold text-gray-900 font-serif">Companion</h1>
                )}
                <button
                    onClick={onToggle}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    {isOpen ? (
                        <ChevronLeft className="w-5 h-5" />
                    ) : (
                        <ChevronRight className="w-5 h-5" />
                    )}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col h-[calc(100%-4rem)] justify-between py-6">
                {/* Top Navigation */}
                <div className="space-y-2 px-3">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                        : 'text-gray-700 hover:bg-gray-100',
                                    !isOpen && 'justify-center'
                                )}
                            >
                                <item.icon className={cn('w-5 h-5', isOpen && 'mr-3')} />
                                {isOpen && <span>{item.name}</span>}
                            </Link>
                        )
                    })}
                </div>

                {/* Bottom Navigation */}
                <div className="space-y-2 px-3">
                    {bottomNavigation.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                        : 'text-gray-700 hover:bg-gray-100',
                                    !isOpen && 'justify-center'
                                )}
                            >
                                <item.icon className={cn('w-5 h-5', isOpen && 'mr-3')} />
                                {isOpen && <span>{item.name}</span>}
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </aside>
    )
}