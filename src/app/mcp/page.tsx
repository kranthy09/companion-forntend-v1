// src/app/mcp/page.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { useMCPChat } from '@/hooks/useMCPChat'
import { useAuthContext } from '@/components/providers/auth-provider'
import { MCPMessage } from '@/components/features/mcp/mcp-message'
import { MCPInput } from '@/components/features/mcp/mcp-input'
import { MCPToolPanel } from '@/components/features/mcp/mcp-tool-panel'
import { Loader2 } from 'lucide-react'

export default function MCPChatPage() {
    const { isAuthenticated } = useAuthContext()
    const { messages, sendMessage, loading, tools, loadTools } = useMCPChat()
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isAuthenticated) {
            loadTools()
        }
    }, [isAuthenticated, loadTools])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    if (!isAuthenticated) return null

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar with tools */}
            <MCPToolPanel tools={tools} />

            {/* Main chat area */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-6 py-4">
                    <h1 className="text-xl font-semibold">MCP Assistant</h1>
                    <p className="text-sm text-gray-500">
                        Ask questions about your data and trigger actions
                    </p>
                </header>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="text-center text-gray-400 mt-20">
                            <p>Start a conversation with your assistant</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => (
                            <MCPMessage key={idx} message={msg} />
                        ))
                    )}
                    {loading && (
                        <div className="flex items-center gap-2 text-gray-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Thinking...</span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <MCPInput onSend={sendMessage} disabled={loading} />
            </div>
        </div>
    )
}