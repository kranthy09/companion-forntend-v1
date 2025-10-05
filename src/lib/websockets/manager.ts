// src/lib/websockets/manager.ts

/**
 * Enhanced WebSocket Manager for Production Use
 *
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Type-safe message handling
 * - Heartbeat/ping-pong for connection health
 * - Message queuing during disconnection
 * - Comprehensive error handling
 * - Memory leak prevention
 */

export interface WebSocketConfig {
    url: string
    reconnectAttempts?: number
    reconnectDelay?: number
    maxReconnectDelay?: number
    heartbeatInterval?: number
    messageQueueSize?: number
    onOpen?: () => void
    onMessage?: (data: any) => void
    onError?: (error: Event) => void
    onClose?: (event: CloseEvent) => void
    onReconnect?: (attempt: number) => void
}

export enum WebSocketState {
    CONNECTING = 0,
    OPEN = 1,
    CLOSING = 2,
    CLOSED = 3,
}

export class WebSocketManager {
    private ws: WebSocket | null = null
    private config: WebSocketConfig
    private reconnectCount = 0
    private maxReconnectAttempts: number
    private baseReconnectDelay: number
    private maxReconnectDelay: number
    private isIntentionallyClosed = false
    private reconnectTimeoutId: NodeJS.Timeout | null = null
    private heartbeatIntervalId: NodeJS.Timeout | null = null
    private messageQueue: any[] = []
    private readonly maxQueueSize: number

    constructor(config: WebSocketConfig) {
        this.config = config
        this.maxReconnectAttempts = config.reconnectAttempts ?? 5
        this.baseReconnectDelay = config.reconnectDelay ?? 1000
        this.maxReconnectDelay = config.maxReconnectDelay ?? 30000
        this.maxQueueSize = config.messageQueueSize ?? 100
    }

    /**
     * Establish WebSocket connection
     */
    connect(): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            console.warn('WebSocket already connected')
            return
        }

        const baseUrl =
            process.env.NEXT_PUBLIC_API_URL ||
            'http://localhost:8010/api/v1'

        // Convert HTTP(S) to WS(S) while preserving the protocol
        const wsProtocol = baseUrl.startsWith('https') ? 'wss' : 'ws'
        const wsUrl =
            `${wsProtocol}://${baseUrl.replace(/^https?:\/\//, '')}${this.config.url
            }`

        console.log('🔌 Connecting to WebSocket:', wsUrl)

        try {
            this.ws = new WebSocket(wsUrl)
            this.setupEventHandlers()
        } catch (error) {
            console.error('Failed to create WebSocket:', error)
            this.handleReconnection()
        }
    }

    /**
     * Setup all WebSocket event handlers
     */
    private setupEventHandlers(): void {
        if (!this.ws) return

        this.ws.onopen = this.handleOpen.bind(this)
        this.ws.onmessage = this.handleMessage.bind(this)
        this.ws.onerror = this.handleError.bind(this)
        this.ws.onclose = this.handleClose.bind(this)
    }

    /**
     * Handle WebSocket open event
     */
    private handleOpen(): void {
        console.log('✅ WebSocket connected')
        this.reconnectCount = 0
        this.isIntentionallyClosed = false

        // Start heartbeat
        this.startHeartbeat()

        // Flush queued messages
        this.flushMessageQueue()

        this.config.onOpen?.()
    }

    /**
     * Handle incoming WebSocket messages
     */
    private handleMessage(event: MessageEvent): void {
        try {
            const data = JSON.parse(event.data)

            // Handle ping/pong for heartbeat
            if (data.type === 'ping') {
                this.send({ type: 'pong' })
                return
            }

            this.config.onMessage?.(data)
        } catch (err) {
            console.error('Failed to parse WebSocket message:', err)
            console.error('Raw message:', event.data)
        }
    }

    /**
     * Handle WebSocket errors
     */
    private handleError(event: Event): void {
        console.error('❌ WebSocket error:', event)
        this.config.onError?.(event)
    }

    /**
     * Handle WebSocket close event
     */
    private handleClose(event: CloseEvent): void {
        console.log(
            '🔌 WebSocket closed:',
            event.code,
            event.reason || 'No reason provided'
        )

        this.stopHeartbeat()
        this.config.onClose?.(event)

        // Attempt reconnection if not intentionally closed
        if (!this.isIntentionallyClosed && event.code !== 1000) {
            this.handleReconnection()
        }
    }

    /**
     * Handle reconnection logic with exponential backoff
     */
    private handleReconnection(): void {
        if (this.reconnectCount >= this.maxReconnectAttempts) {
            console.error(
                `❌ Max reconnection attempts (${this.maxReconnectAttempts}) ` +
                `reached. Giving up.`
            )
            return
        }

        this.reconnectCount++

        // Exponential backoff: delay * 2^(attempt - 1)
        const delay = Math.min(
            this.baseReconnectDelay * Math.pow(2, this.reconnectCount - 1),
            this.maxReconnectDelay
        )

        console.log(
            `🔄 Reconnecting in ${delay}ms... ` +
            `(attempt ${this.reconnectCount}/${this.maxReconnectAttempts})`
        )

        this.config.onReconnect?.(this.reconnectCount)

        // Clear any existing reconnect timeout
        if (this.reconnectTimeoutId) {
            clearTimeout(this.reconnectTimeoutId)
        }

        this.reconnectTimeoutId = setTimeout(() => {
            this.reconnectTimeoutId = null
            this.connect()
        }, delay)
    }

    /**
     * Start heartbeat to keep connection alive
     */
    private startHeartbeat(): void {
        const interval = this.config.heartbeatInterval ?? 30000 // 30s default

        if (interval <= 0) return

        this.heartbeatIntervalId = setInterval(() => {
            if (this.isConnected()) {
                this.send({ type: 'ping' })
            }
        }, interval)
    }

    /**
     * Stop heartbeat interval
     */
    private stopHeartbeat(): void {
        if (this.heartbeatIntervalId) {
            clearInterval(this.heartbeatIntervalId)
            this.heartbeatIntervalId = null
        }
    }

    /**
     * Send data through WebSocket
     * Queues messages if connection is not open
     */
    send(data: any): boolean {
        const message =
            typeof data === 'string' ? data : JSON.stringify(data)

        if (this.ws?.readyState === WebSocket.OPEN) {
            try {
                this.ws.send(message)
                return true
            } catch (error) {
                console.error('Failed to send WebSocket message:', error)
                this.queueMessage(data)
                return false
            }
        } else {
            console.warn(
                'WebSocket is not open. Current state:',
                this.getStateString()
            )
            this.queueMessage(data)
            return false
        }
    }

    /**
     * Queue message for later sending
     */
    private queueMessage(data: any): void {
        if (this.messageQueue.length >= this.maxQueueSize) {
            console.warn(
                `Message queue full (${this.maxQueueSize}). ` +
                `Dropping oldest message.`
            )
            this.messageQueue.shift()
        }

        this.messageQueue.push(data)
    }

    /**
     * Flush all queued messages
     */
    private flushMessageQueue(): void {
        if (this.messageQueue.length === 0) return

        console.log(
            `📤 Flushing ${this.messageQueue.length} queued messages`
        )

        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift()
            this.send(message)
        }
    }

    /**
     * Close WebSocket connection
     */
    close(code = 1000, reason = 'Normal closure'): void {
        this.isIntentionallyClosed = true

        // Clear any pending reconnection
        if (this.reconnectTimeoutId) {
            clearTimeout(this.reconnectTimeoutId)
            this.reconnectTimeoutId = null
        }

        this.stopHeartbeat()
        this.ws?.close(code, reason)
        this.ws = null

        // Clear message queue
        this.messageQueue = []
    }

    /**
     * Check if WebSocket is connected
     */
    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN
    }

    /**
     * Get current WebSocket state
     */
    getState(): WebSocketState {
        return this.ws?.readyState ?? WebSocketState.CLOSED
    }

    /**
     * Get human-readable state string
     */
    getStateString(): string {
        const state = this.getState()
        const stateNames = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED']
        return stateNames[state] || 'UNKNOWN'
    }

    /**
     * Get reconnection status
     */
    getReconnectionInfo(): {
        count: number
        maxAttempts: number
        isReconnecting: boolean
    } {
        return {
            count: this.reconnectCount,
            maxAttempts: this.maxReconnectAttempts,
            isReconnecting: this.reconnectTimeoutId !== null,
        }
    }

    /**
     * Force reconnection (useful for manual retry)
     */
    reconnect(): void {
        console.log('🔄 Manual reconnection triggered')
        this.close(1000, 'Manual reconnection')
        this.isIntentionallyClosed = false
        this.reconnectCount = 0
        this.connect()
    }
}

/**
 * Factory function for creating WebSocket connections
 * Simplified interface for common use cases
 */
export function createWebSocket(
    url: string,
    options?: Partial<WebSocketConfig>
): WebSocketManager {
    const config: WebSocketConfig = {
        url,
        ...options,
    }

    const manager = new WebSocketManager(config)
    manager.connect()

    return manager
}

/**
 * Utility function for creating task status WebSocket
 * Pre-configured for common task monitoring pattern
 */
export function createTaskStatusWebSocket(
    taskId: string,
    onMessage: (data: any) => void,
    onError?: (error: Event) => void
): WebSocketManager {
    return createWebSocket(`/ws/task_status/${taskId}`, {
        reconnectAttempts: 3,
        reconnectDelay: 2000,
        heartbeatInterval: 0, // Disable for short-lived connections
        onMessage,
        onError,
        onClose: (event) => {
            if (event.code !== 1000) {
                console.warn('Task status WebSocket closed unexpectedly')
            }
        },
    })
}