"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useBlogStore } from "@/stores/blog-store";
import type { BlogPostCreate } from "@/types/blog";

interface BlogCreateProps {
    onBlogCreated?: (id: number) => void;
}

export default function BlogCreate({ onBlogCreated }: BlogCreateProps) {
    const router = useRouter();
    const { createPost, loading } = useBlogStore();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    const handleSave = async () => {
        if (!title.trim() || !content.trim()) return;

        const newPost: BlogPostCreate = { title, content };
        const created = await createPost(newPost);

        if (created) {
            onBlogCreated?.(created.id);

            if (!onBlogCreated) {
                router.push(`/blog/${created.id}`);
            }
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Create Blog</h2>
            <Input
                placeholder="Enter title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
                placeholder="Write your content..."
                rows={10}
                value={content}
                onChange={(e) => setContent(e.target.value)}
            />
            <Button onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : "Save Blog"}
            </Button>
        </div>
    );
}
