// src/lib/websockets/manager.ts
import { CookieManager } from '@/lib/cookies'

export interface WebSocketConfig {
    url: string
    reconnectAttempts?: number
    reconnectDelay?: number
    onOpen?: () => void
    onMessage?: (data: any) => void
    onError?: (error: Event) => void
    onClose?: (event: CloseEvent) => void
}

export class WebSocketManager {
    private ws: WebSocket | null = null
    private config: WebSocketConfig
    private reconnectCount = 0
    private maxReconnectAttempts: number
    private reconnectDelay: number
    private isIntentionallyClosed = false

    constructor(config: WebSocketConfig) {
        this.config = config
        this.maxReconnectAttempts = config.reconnectAttempts ?? 3
        this.reconnectDelay = config.reconnectDelay ?? 2000
    }

    connect(): void {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8010/api/v1'
        // Keep /api/v1 in the URL, just swap http -> ws
        const wsUrl = `${baseUrl.replace('http', 'ws')}${this.config.url}`

        console.log('🔌 Connecting to WebSocket:', wsUrl)
        this.ws = new WebSocket(wsUrl)
        this.setupEventHandlers()
    }

    private setupEventHandlers(): void {
        if (!this.ws) return

        this.ws.onopen = () => {
            console.log('✅ WebSocket connected')
            this.reconnectCount = 0
            this.config.onOpen?.()
        }

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)
                this.config.onMessage?.(data)
            } catch (err) {
                console.error('Failed to parse WebSocket message:', err)
            }
        }

        this.ws.onerror = (event) => {
            console.error('❌ WebSocket error:', event)
            this.config.onError?.(event)
        }

        this.ws.onclose = (event) => {
            console.log('🔌 WebSocket closed:', event.code, event.reason)
            this.config.onClose?.(event)

            // Attempt reconnection if not intentionally closed
            if (!this.isIntentionallyClosed &&
                event.code !== 1000 &&
                this.reconnectCount < this.maxReconnectAttempts) {
                this.reconnectCount++
                console.log(`🔄 Reconnecting... (${this.reconnectCount}/${this.maxReconnectAttempts})`)

                setTimeout(() => {
                    this.connect()
                }, this.reconnectDelay)
            }
        }
    }

    send(data: any): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(typeof data === 'string' ? data : JSON.stringify(data))
        } else {
            console.warn('WebSocket is not open. Current state:', this.ws?.readyState)
        }
    }

    close(code = 1000, reason = 'Normal closure'): void {
        this.isIntentionallyClosed = true
        this.ws?.close(code, reason)
    }

    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN
    }

    getState(): number {
        return this.ws?.readyState ?? WebSocket.CLOSED
    }
}

// Factory function for creating WebSocket connections
export function createWebSocket(config: WebSocketConfig): WebSocketManager {
    return new WebSocketManager(config)
}