'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useBlogStore } from '@/stores/blog-store'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Loader2, Plus, Search } from 'lucide-react'

export default function BlogListPage() {
    const router = useRouter()
    const { posts, loading, error, fetchPosts } = useBlogStore()
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchPosts()
    }, [fetchPosts])

    const handleSearch = () => {
        fetchPosts({ search })
    }

    const handleCreate = () => {
        router.push('/blog/builder')
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] dark:from-[#0f172a] dark:to-[#1e293b]">
            <div className="container mx-auto px-4 py-10 max-w-6xl">
                {/* Header Section */}
                <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 gap-4">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                        ✨ Explore Blogs
                    </h1>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search
                                size={18}
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                            />
                            <Input
                                placeholder="Search blogs..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
                            />
                        </div>
                        <Button onClick={handleSearch} variant="outline">
                            Search
                        </Button>
                        <Button
                            onClick={handleCreate}
                            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                        >
                            <Plus size={16} />
                            Create
                        </Button>
                    </div>
                </header>

                {/* Loading & Error */}
                {loading && (
                    <div className="flex justify-center py-16">
                        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
                    </div>
                )}
                {error && (
                    <p className="text-red-600 text-center py-4">Error: {error}</p>
                )}

                {/* Blog List */}
                {!loading && posts.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {posts.map((blog) => (
                            <Link key={blog.id} href={`/blog/${blog.id}`}>
                                <Card className="group cursor-pointer border border-transparent bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm transition-all duration-300 hover:border-blue-500 hover:shadow-lg">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                            {blog.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-slate-600 dark:text-slate-300 line-clamp-4 text-sm leading-relaxed">
                                        {blog.content || 'No content yet.'}
                                    </CardContent>
                                    {/* <CardFooter className="pt-3 flex justify-between text-xs text-slate-400">

                                        <span>
                                            {blog.created_at
                                                ? new Date(blog.created_at).toLocaleDateString()
                                                : '—'}
                                        </span>
                                    </CardFooter> */}
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    !loading &&
                    !error && (
                        <div className="text-center text-slate-500 py-16">
                            <p className="text-lg font-medium">No blogs found.</p>
                            <p className="text-sm text-slate-400">
                                Try searching for something else or create a new post.
                            </p>
                        </div>
                    )
                )}
            </div>
        </div>
    )
}
