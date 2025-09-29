// src/lib/api/client.ts
import { APIError, APIResponse } from '@/types/api'

class APIClient {
    private baseURL = process.env.NEXT_PUBLIC_API_URL!
    private isRefreshing = false
    private failedQueue: Array<{
        resolve: (success: boolean) => void
        reject: (error: any) => void
    }> = []

    private async getCsrfToken(): Promise<string> {
        const cookies = document.cookie.split(';')
        const csrfCookie = cookies.find(c => c.trim().startsWith('csrf_token='))
        return csrfCookie?.split('=')[1] || ''
    }

    private async refreshToken(): Promise<boolean> {
        if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
                this.failedQueue.push({ resolve, reject })
            })
        }

        this.isRefreshing = true

        try {
            // Get refresh token from HTTP-only cookie
            const response = await fetch(`${this.baseURL}/auth/refresh`, {
                method: 'POST',
                credentials: 'include', // Sends HTTP-only cookies
                headers: { 'Content-Type': 'application/json' },
            })

            if (!response.ok) throw new Error('Refresh failed')

            // New tokens are set via HTTP-only cookies by backend
            this.failedQueue.forEach(({ resolve }) => resolve(true))
            this.failedQueue = []

            return true
        } catch (error) {
            this.failedQueue.forEach(({ reject }) => reject(error))
            this.failedQueue = []
            // Redirect to login on refresh failure
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

        // Add CSRF token for non-GET requests
        if (fetchOptions.method && fetchOptions.method !== 'GET') {
            const csrfToken = await this.getCsrfToken()
            if (csrfToken) headers['X-CSRF-Token'] = csrfToken
        }

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                ...fetchOptions,
                headers,
                credentials: 'include', // Always include cookies
            })

            const data = await response.json()

            if (!response.ok) {
                // Handle token expiry - cookies will be refreshed automatically
                if (response.status === 401 && !skipAuth && !endpoint.includes('/auth/')) {
                    try {
                        await this.refreshToken()
                        // Retry original request
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

    // HTTP methods
    get<T>(endpoint: string, options?: RequestInit) {
        return this.request<T>(endpoint, { ...options, method: 'GET' })
    }

    post<T>(endpoint: string, data?: any, options?: RequestInit, skipAuth?: boolean) {
        return this.request<T>(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data),
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