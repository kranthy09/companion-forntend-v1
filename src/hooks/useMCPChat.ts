// src/hooks/useMCPChat.ts
import { useState, useCallback } from 'react'
import { api } from '@/lib/api/endpoints'
import { getResponseData } from '@/lib/api/client'
import type { MCPMessage, MCPTool } from '@/types/mcp'

export type { MCPMessage, MCPTool }

export function useMCPChat() {
    const [messages, setMessages] = useState<MCPMessage[]>([])
    const [loading, setLoading] = useState(false)
    const [tools, setTools] = useState<MCPTool[]>([])

    const sendMessage = useCallback(async (content: string) => {
        const userMsg: MCPMessage = {
            role: 'user',
            content,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMsg])
        setLoading(true)

        try {
            const response = await api.mcp.chat({
                message: content,
                history: messages
            })

            const data = getResponseData(response)

            const assistantMsg: MCPMessage = {
                role: 'assistant',
                content: data.content,
                tool_calls: data.tool_calls,
                timestamp: new Date()
            }

            setMessages(prev => [...prev, assistantMsg])
        } catch (err) {
            console.error('MCP chat error:', err)
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date()
            }])
        } finally {
            setLoading(false)
        }
    }, [messages])

    const loadTools = useCallback(async () => {
        try {
            const response = await api.mcp.getTools()
            const data = getResponseData(response)
            setTools(data)
        } catch (err) {
            console.warn('Tools endpoint not available yet')
            // Set empty array as fallback
            setTools([])
        }
    }, [])

    return { messages, sendMessage, loading, tools, loadTools }
}