"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useBlogStore } from "@/stores/blog-store";

export default function BlogReader() {
    const params = useParams();
    const { selectedPost, fetchPostById, loading } = useBlogStore();

    useEffect(() => {
        if (params?.id) fetchPostById(Number(params.id), true);
    }, [params?.id, fetchPostById]);

    if (loading) return <p className="p-8 text-center text-slate-400">Loading...</p>;
    if (!selectedPost) return <p className="p-8 text-center text-slate-500">Post not found.</p>;

    const { title, content } = selectedPost;

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#faf9f7] to-[#f3f2ef] text-slate-800 px-6 py-16">
            <article className="max-w-3xl mx-auto space-y-8">
                <header className="space-y-2 text-center">
                    <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
                </header>

                <div className="h-[1px] bg-slate-200 w-1/2 mx-auto" />

                <section
                    className="prose prose-slate prose-lg mx-auto leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            </article>
        </div>
    );
}
