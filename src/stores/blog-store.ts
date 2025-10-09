// src/stores/blog-store.ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { enableMapSet } from 'immer'
import { api } from '@/lib/api/endpoints'
import type {
    BlogPost,
    BlogPostCreate,
    BlogPostUpdate,
    BlogQuery,
    BlogCategory,
} from '@/types/blog'

enableMapSet()

interface BlogState {
    posts: BlogPost[]
    selectedPost: BlogPost | null
    categories: BlogCategory[]
    loading: boolean
    error: string | null
    query: BlogQuery
}

interface BlogActions {
    fetchPosts: (query?: Partial<BlogQuery>) => Promise<void>
    fetchPostById: (id: number, incrementView?: boolean) => Promise<void>
    fetchPostBySlug: (slug: string, incrementView?: boolean) => Promise<void>
    createPost: (data: BlogPostCreate) => Promise<BlogPost | null>
    updatePost: (id: number, data: BlogPostUpdate) => Promise<void>
    deletePost: (id: number) => Promise<void>
    fetchCategories: () => Promise<void>
    selectPost: (post: BlogPost | null) => void
    setQuery: (query: Partial<BlogQuery>) => void
    clearError: () => void
}

export const useBlogStore = create<BlogState & BlogActions>()(
    immer((set, get) => ({
        posts: [],
        selectedPost: null,
        categories: [],
        loading: false,
        error: null,
        query: { page: 1, page_size: 10, sort_by: 'created_at', sort_order: 'desc' },

        fetchPosts: async (newQuery) => {
            set((s) => {
                s.loading = true
                s.error = null
                if (newQuery) s.query = { ...s.query, ...newQuery }
            })
            try {
                const response = await api.blog.list(get().query)
                set((state) => {
                    // Defensive: handle both wrapped and direct array responses
                    const data = response.data
                    if (Array.isArray(data)) {
                        state.posts = data
                    } else if (data?.posts) {
                        state.posts = data.posts
                    } else {
                        state.posts = []
                    }
                    state.loading = false
                })
            } catch (err: any) {
                set((s) => {
                    s.error = err.message
                    s.loading = false
                })
            }
        },

        fetchPostById: async (id, incrementView = true) => {
            set((s) => {
                s.loading = true
                s.error = null
            })
            try {
                const res = await api.blog.getById(id, { increment_view: incrementView })
                set((s) => {
                    s.selectedPost = res.data ?? null
                    s.loading = false
                })
            } catch (err: any) {
                set((s) => {
                    s.error = err.message
                    s.loading = false
                })
            }
        },

        fetchPostBySlug: async (slug, incrementView = true) => {
            set((s) => {
                s.loading = true
                s.error = null
            })
            try {
                const res = await api.blog.getBySlug(slug, { increment_view: incrementView })
                set((s) => {
                    s.selectedPost = res.data ?? null
                    s.loading = false
                })
            } catch (err: any) {
                set((s) => {
                    s.error = err.message
                    s.loading = false
                })
            }
        },

        createPost: async (data) => {
            try {
                const res = await api.blog.create(data)
                if (res.success && res.data) {
                    set((s) => {
                        s.posts.unshift(res.data!)
                    })
                    return res.data
                }
                return null
            } catch (err: any) {
                set((s) => {
                    s.error = err.message
                })
                return null
            }
        },

        updatePost: async (id, data) => {
            try {
                const res = await api.blog.update(id, data)
                if (res.success && res.data) {
                    set((s) => {
                        const i = s.posts.findIndex((p) => p.id === id)
                        if (i !== -1) s.posts[i] = res.data!
                        if (s.selectedPost?.id === id) s.selectedPost = res.data!
                    })
                }
            } catch (err: any) {
                set((s) => {
                    s.error = err.message
                })
            }
        },

        deletePost: async (id) => {
            try {
                await api.blog.delete(id)
                set((s) => {
                    s.posts = s.posts.filter((p) => p.id !== id)
                    if (s.selectedPost?.id === id) s.selectedPost = null
                })
            } catch (err: any) {
                set((s) => {
                    s.error = err.message
                })
            }
        },

        fetchCategories: async () => {
            try {
                const res = await api.blog.categories()
                set((s) => {
                    s.categories = res.data || []
                })
            } catch (err: any) {
                console.error('Fetch categories error:', err)
            }
        },

        selectPost: (post) => {
            set((s) => {
                s.selectedPost = post
            })
        },

        setQuery: (newQuery) => {
            set((s) => {
                s.query = { ...s.query, ...newQuery }
            })
        },

        clearError: () => {
            set((s) => {
                s.error = null
            })
        },
    }))
)
