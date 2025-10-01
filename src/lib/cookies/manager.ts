// src/lib/cookies/manager.ts

export class CookieManager {
    private static readonly ACCESS_TOKEN = 'access_token'
    private static readonly CSRF_TOKEN = 'csrf_token'
    private static readonly REFRESH_TOKEN = 'refresh_token'

    static get(name: string): string | null {
        if (typeof document === 'undefined') return null

        const value = document.cookie
            .split('; ')
            .find(row => row.startsWith(`${name}=`))
            ?.split('=')[1]

        return value || null
    }

    static getAccessToken(): string | null {
        return this.get(this.ACCESS_TOKEN)
    }

    static getCSRFToken(): string | null {
        return this.get(this.CSRF_TOKEN)
    }

    static getRefreshToken(): string | null {
        return this.get(this.REFRESH_TOKEN)
    }

    static isAuthenticated(): boolean {
        return !!this.getAccessToken()
    }

    static getAll(): Record<string, string> {
        if (typeof document === 'undefined') return {}

        return document.cookie
            .split('; ')
            .reduce((acc, cookie) => {
                const [name, value] = cookie.split('=')
                if (name && value) acc[name] = value
                return acc
            }, {} as Record<string, string>)
    }

    static has(name: string): boolean {
        return this.get(name) !== null
    }

    static clear(name: string): void {
        if (typeof document === 'undefined') return
        document.cookie = `${name}=; path=/; max-age=0`
    }
}

// Convenience exports
export const getAccessToken = () => CookieManager.getAccessToken()
export const getCSRFToken = () => CookieManager.getCSRFToken()
export const isAuthenticated = () => CookieManager.isAuthenticated()