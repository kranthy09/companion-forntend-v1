// src/hooks/useAuth.ts
import { useState, useEffect } from 'react'
import { authManager } from '@/lib/auth/manager'
import type { User, LoginData, RegisterData } from '@/types/auth'

export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Initialize session
        authManager.getSession().finally(() => setLoading(false))

        // Subscribe to auth changes
        const unsubscribe = authManager.subscribe(setUser)
        return unsubscribe
    }, [])

    const login = async (credentials: LoginData) => {
        setLoading(true)
        try {
            return await authManager.login(credentials)
        } finally {
            setLoading(false)
        }
    }

    const register = async (data: RegisterData) => {
        setLoading(true)
        try {
            return await authManager.register(data)
        } finally {
            setLoading(false)
        }
    }

    const logout = async () => {
        setLoading(true)
        try {
            await authManager.logout()
        } finally {
            setLoading(false)
        }
    }

    return {
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
    }
}