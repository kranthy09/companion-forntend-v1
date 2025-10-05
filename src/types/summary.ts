// src/types/summary.ts
export interface SavedSummary {
    id: number
    content: string
    created_at: string
}

export interface NoteSummaryResponse {
    summaries: SavedSummary[]
}