// src/hooks/useSummaryStreaming.ts
import { useSSEStream } from "./useSSEStreaming"
import { CookieManager } from "@/lib/cookies"

export function useBlogStreaming(noteId: number) {
    const { isStreaming, streamedContent, error, taskId, startStreaming, stopStreaming } =
        useSSEStream()

    const startSummary = () => {
        const csrf = CookieManager.getCSRFToken()
        const baseUrl = process.env.NEXT_PUBLIC_API_URL!

        startStreaming(`${baseUrl}/blog/generate/stream`, {
            method: "POST",
            headers: { "X-CSRF-Token": csrf || "" },
            body: { note_id: noteId },
            autoReconnect: true,
            maxRetries: 5,
            retryDelay: 3000,
            onStart: (tid) => console.log("🟢 Stream started:", tid),
            onChunk: (chunk) => console.log("📦 Chunk:", chunk),
            onComplete: (text) => console.log("✅ Completed, total chars:", text.length),
            onError: (err) => console.error("❌ Stream error:", err),
            onReconnect: (attempt) => console.log(`♻️ Reconnecting (${attempt})...`),
            onReconnectSuccess: () => console.log("🔄 Reconnected successfully"),
        })
    }

    return { isStreaming, streamedContent, error, taskId, startSummary, stopStreaming }
}
