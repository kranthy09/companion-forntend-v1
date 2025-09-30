// src/app/settings/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { User, Mail, Calendar, LogOut, Shield } from 'lucide-react'
import { format } from 'date-fns'

export default function SettingsPage() {
    const router = useRouter()
    const { user, isAuthenticated, loading, logout } = useAuthContext()
    const [loggingOut, setLoggingOut] = useState(false)

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/auth/login')
        }
    }, [isAuthenticated, loading, router])

    const handleLogout = async () => {
        if (confirm('Are you sure you want to logout?')) {
            setLoggingOut(true)
            try {
                await logout()
                router.push('/auth/login')
            } catch (error) {
                setLoggingOut(false)
            }
        }
    }

    if (loading || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
                <p className="text-gray-600">Manage your account settings and preferences</p>
            </div>

            {/* Profile Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <div className="flex items-center mb-6">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                        <User className="w-10 h-10 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900">
                            {user?.full_name || 'User'}
                        </h2>
                        <p className="text-gray-600">{user?.email}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Email */}
                    <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                        <Mail className="w-5 h-5 text-gray-500 mr-3" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">Email Address</p>
                            <p className="text-sm text-gray-900">{user?.email}</p>
                        </div>
                    </div>

                    {/* Account Status */}
                    <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                        <Shield className="w-5 h-5 text-gray-500 mr-3" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">Account Status</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user?.is_active
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                        }`}
                                >
                                    {user?.is_active ? 'Active' : 'Inactive'}
                                </span>
                                {user?.is_verified && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                        Verified
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Account Activity */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Account Activity
                </h3>

                <div className="space-y-4">
                    {user?.created_at && (
                        <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                            <Calendar className="w-5 h-5 text-gray-500 mr-3" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-700">Member Since</p>
                                <p className="text-sm text-gray-900">
                                    {format(new Date(user.created_at), 'MMMM d, yyyy')}
                                </p>
                            </div>
                        </div>
                    )}

                    {user?.updated_at && (
                        <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                            <Calendar className="w-5 h-5 text-gray-500 mr-3" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-700">Last Activity</p>
                                <p className="text-sm text-gray-900">
                                    {format(new Date(user.updated_at), 'MMMM d, yyyy')}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-lg border border-red-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Session Management
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    Logout from your account. You'll need to login again to access your notes.
                </p>
                <Button
                    variant="destructive"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full sm:w-auto"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    {loggingOut ? 'Logging out...' : 'Logout'}
                </Button>
            </div>
        </div>
    )
}