// src/components/features/auth/login-form.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { LoginData } from '@/types/auth'

export function LoginForm() {
    const router = useRouter()
    const { login, loading } = useAuthContext()
    const [error, setError] = useState('')
    const [formData, setFormData] = useState<LoginData>({
        username: '',      // Changed from username to email
        password: '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        try {
            const response = await login(formData)
            if (response.success) {
                router.push('/notes')
            } else {
                setError(response.error?.message || 'Login failed')
            }
        } catch (err: any) {
            setError(err.message || 'Network error')
        }
    }

    const handleChange = (field: keyof LoginData) => (e: React.ChangeEvent<HTMLInputElement>) => {
        if (field === 'username') {
            // Map email input to username field for backend
            setFormData(prev => ({ ...prev, username: e.target.value }))
        } else {
            setFormData(prev => ({ ...prev, [field]: e.target.value }))
        }
    }

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center mb-6">Sign In</h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Input
                            type="email"
                            placeholder="Email"
                            value={formData.username}
                            onChange={handleChange('username')}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <Input
                            type="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange('password')}
                            required
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <div className="text-red-600 text-sm text-center">{error}</div>
                    )}

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                </form>

                <p className="text-center text-sm text-gray-600 mt-4">
                    Don't have an account?{' '}
                    <a href="/auth/register" className="text-blue-600 hover:underline">
                        Sign up
                    </a>
                </p>
            </div>
        </div>
    )
}