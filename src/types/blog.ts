export interface BlogPost {
    id: number
    title: string
    slug: string
    content: string
    excerpt?: string
    category_id?: number
    tags?: string[]
    status?: 'draft' | 'published' | 'archived'
    author_id?: number
    is_featured?: boolean
    created_at?: string
    updated_at?: string
}

export interface BlogPostCreate {
    title: string
    content: string
    category_id?: number
    tags?: string[]
    status?: 'draft' | 'published'
    is_featured?: boolean
}

export interface BlogPostUpdate extends Partial<BlogPostCreate> { }

export interface BlogQuery {
    search?: string
    category_id?: number
    tags?: string
    status?: string
    author_id?: number
    is_featured?: boolean
    sort_by?: string
    sort_order?: 'asc' | 'desc'
    page?: number
    page_size?: number
}

export interface BlogCategory {
    id: number
    name: string
    slug: string
}

// src/types/blog.ts

export interface BlogPost {
    id: number
    title: string
    slug: string
    content: string
    excerpt?: string
    featured_image?: string
    category_id?: number
    tags?: string[]
    meta_description?: string
    meta_keywords?: string[]
    status?: 'draft' | 'published' | 'archived'
    is_featured?: boolean
    is_commentable?: boolean
    created_at?: string
    updated_at?: string
    author_id?: number
}

export interface BlogPostCreate {
    title: string
    content: string
    excerpt?: string
    category_id?: number
    tags?: string[]
    meta_description?: string
    meta_keywords?: string[]
    status?: 'draft' | 'published'
    is_featured?: boolean
    is_commentable?: boolean
}

export interface BlogPostUpdate extends Partial<BlogPostCreate> { }

export interface BlogQuery {
    search?: string
    category_id?: number
    tags?: string
    status?: string
    author_id?: number
    is_featured?: boolean
    sort_by?: string
    sort_order?: 'asc' | 'desc'
    page?: number
    page_size?: number
}

export interface BlogCategory {
    id: number
    name: string
    slug: string
}

export interface BlogCommentCreate {
    content: string
}

export interface BlogCommentResponse {
    id: number
    post_id: number
    content: string
    author_id: number
    created_at: string
}

export interface BlogGenerateRequest {
    blog_id: number
    enhancement_type: 'improve' | 'expand' | 'summarize'
}

// src/types/blog.ts
export interface BlogListResponse {
    posts: BlogPost[]
    total: number
    page: number
    page_size: number
    total_pages: number
}
