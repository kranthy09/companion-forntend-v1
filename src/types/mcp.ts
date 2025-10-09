// src/types/mcp.ts
export interface MCPMessage {
    role: 'user' | 'assistant'
    content: string
    tool_calls?: MCPToolCall[]
    timestamp: Date
}

export interface MCPToolCall {
    name: string
    args: Record<string, unknown>
    result?: string
}

export interface MCPTool {
    name: string
    description: string
    parameters: Record<string, unknown>
}

export interface MCPChatRequest {
    message: string
    history?: Array<{ role: string; content: string }>
}

export interface MCPChatResponse {
    content: string
    tool_calls?: MCPToolCall[]
}

export interface MCPToolsResponse {
    tools: MCPTool[]
}