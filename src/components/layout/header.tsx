// src/components/layout/header.tsx
'use client'
import { useState } from 'react'
import { useAuthContext } from '@/components/providers/auth-provider'
import { Menu, User, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
    onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
    const { user, logout } = useAuthContext()
    const [showUserMenu, setShowUserMenu] = useState(false)

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
            <div className="flex items-center">
                <button
                    onClick={onMenuClick}
                    className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
                >
                    <Menu className="w-5 h-5" />
                </button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative">
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
                    >
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium hidden sm:block">
                            {user?.full_name || user?.email}
                        </span>
                    </button>

                    {showUserMenu && (
                        <div className="absolute right-0 top-12 bg-white border rounded-lg shadow-lg z-10 w-48">
                            <div className="p-3 border-b">
                                <p className="text-sm font-medium">{user?.full_name}</p>
                                <p className="text-xs text-gray-500">{user?.email}</p>
                            </div>
                            <button
                                onClick={logout}
                                className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Sign out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}