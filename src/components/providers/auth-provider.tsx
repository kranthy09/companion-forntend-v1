// src/components/providers/auth-provider.tsx
'use client'
import { createContext, useContext, ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import type { User, LoginData, RegisterData } from '@/types/auth'

interface AuthContextType {
    user: User | null
    loading: boolean
    isAuthenticated: boolean
    login: (credentials: LoginData) => Promise<any>
    register: (data: RegisterData) => Promise<any>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const auth = useAuth()

    return (
        <AuthContext.Provider value={auth}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuthContext() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuthContext must be used within AuthProvider')
    }
    return context
}