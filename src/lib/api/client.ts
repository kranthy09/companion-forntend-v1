// src/lib/api/client.ts
import { APIError, APIResponse } from '@/types/api'
import { CookieManager } from '@/lib/cookies'

class APIClient {
    private baseURL = process.env.NEXT_PUBLIC_API_URL!
    private isRefreshing = false
    private failedQueue: Array<{
        resolve: (success: boolean) => void
        reject: (error: any) => void
    }> = []

    private async refreshToken(): Promise<boolean> {
        if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
                this.failedQueue.push({ resolve, reject })
            })
        }

        this.isRefreshing = true

        try {
            const response = await fetch(`${this.baseURL}/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
            })

            if (!response.ok) throw new Error('Refresh failed')

            this.failedQueue.forEach(({ resolve }) => resolve(true))
            this.failedQueue = []

            return true
        } catch (error) {
            this.failedQueue.forEach(({ reject }) => reject(error))
            this.failedQueue = []
            window.location.href = '/auth/login'
            throw error
        } finally {
            this.isRefreshing = false
        }
    }

    async request<T>(
        endpoint: string,
        options: RequestInit = {},
        skipAuth: boolean = false
    ): Promise<APIResponse<T>> {
        const fetchOptions = options

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...Object.fromEntries(
                Object.entries(fetchOptions.headers || {}).map(([k, v]) => [k, String(v)])
            )
        }

        // Add CSRF token for non-GET requests using CookieManager
        if (fetchOptions.method && fetchOptions.method !== 'GET') {
            const csrfToken = CookieManager.getCSRFToken()
            if (csrfToken) headers['X-CSRF-Token'] = csrfToken
        }

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                ...fetchOptions,
                headers,
                credentials: 'include',
            })

            const data = await response.json()

            if (!response.ok) {
                if (response.status === 401 && !skipAuth && !endpoint.includes('/auth/')) {
                    try {
                        await this.refreshToken()
                        return this.request(endpoint, options)
                    } catch {
                        throw new APIError('AUTH_002', 'Session expired', 401)
                    }
                }

                throw new APIError(
                    data.error?.code || 'UNKNOWN_ERROR',
                    data.error?.message || 'Request failed',
                    response.status,
                    data.error?.field
                )
            }

            return data
        } catch (error) {
            if (error instanceof APIError) throw error
            throw new APIError('NETWORK_ERROR', 'Network request failed', 0)
        }
    }

    get<T>(endpoint: string, options?: RequestInit) {
        return this.request<T>(endpoint, { ...options, method: 'GET' })
    }

    post<T>(endpoint: string, data?: any, options?: RequestInit, skipAuth?: boolean) {
        return this.request<T>(endpoint, {
            ...options,
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        }, skipAuth)
    }

    put<T>(endpoint: string, data?: any, options?: RequestInit) {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data),
        })
    }

    delete<T>(endpoint: string, options?: RequestInit) {
        return this.request<T>(endpoint, { ...options, method: 'DELETE' })
    }
}

export const apiClient = new APIClient()