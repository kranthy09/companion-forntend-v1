"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const BlogCreate = dynamic(() => import("../create/page"), { ssr: false });
const BlogView = dynamic<{ id?: number }>(
    () => import("../[id]/page"),
    { ssr: false }
);

export default function BlogBuilder() {
    const [createdId, setCreatedId] = useState<number | null>(null);

    return (
        <div className="flex h-screen">
            {/* Editor Side */}
            <motion.div
                className="w-1/2 bg-[#f9fafb] border-r overflow-y-auto p-8"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
            >
                <h1 className="text-2xl font-semibold mb-4">✍️ Write your blog</h1>
                <BlogCreate onBlogCreated={(id) => setCreatedId(id)} />
            </motion.div>

            {/* Preview Side */}
            <motion.div
                className="w-1/2 bg-[#fffaf5] overflow-y-auto p-8"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
            >
                <h1 className="text-2xl font-semibold mb-4">🪄 Preview</h1>
                {createdId ? (
                    <BlogView id={createdId} />
                ) : (
                    <div className="flex h-full items-center justify-center text-slate-400 italic">
                        Your live preview will appear here once you save.
                    </div>
                )}
            </motion.div>
        </div>
    );
}
