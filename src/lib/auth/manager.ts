// src/lib/auth/manager.ts
import { api } from '@/lib/api/endpoints'
import { CookieManager } from '@/lib/cookies'
import type { User, LoginData, RegisterData } from '@/types/auth'
import type { APIResponse } from '@/types/api'

class AuthManager {
    private user: User | null = null
    private listeners: Array<(user: User | null) => void> = []

    subscribe(callback: (user: User | null) => void) {
        this.listeners.push(callback)
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback)
        }
    }

    private notify() {
        this.listeners.forEach(callback => callback(this.user))
    }

    async login(credentials: LoginData): Promise<APIResponse<any>> {
        const response = await api.auth.login(credentials)
        if (response.success) {
            await this.getSession()
        }
        return response
    }

    async register(data: RegisterData): Promise<APIResponse<any>> {
        const response = await api.auth.register(data)
        if (response.success) {
            await this.getSession()
        }
        return response
    }

    async logout(): Promise<void> {
        try {
            await api.auth.logout()
        } finally {
            this.user = null
            this.notify()
        }
    }

    async getSession(): Promise<User | null> {
        try {
            const response = await api.auth.session()
            this.user = response.data?.user || null
            this.notify()
            return this.user
        } catch {
            this.user = null
            this.notify()
            return null
        }
    }

    getUser(): User | null {
        return this.user
    }

    isAuthenticated(): boolean {
        // Check both user state and cookie
        return !!this.user && CookieManager.isAuthenticated()
    }

    hasValidToken(): boolean {
        return CookieManager.isAuthenticated()
    }
}

export const authManager = new AuthManager()