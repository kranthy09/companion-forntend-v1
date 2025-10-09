// src/components/features/mcp/mcp-message.tsx
import { cn } from '@/lib/utils'
import { User, Bot, CheckCircle } from 'lucide-react'
import type { MCPMessage } from '@/hooks/useMCPChat'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'

interface Props {
    message: MCPMessage
}

const markdownComponents: Components = {
    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
    code: ({ children }) => (
        <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">
            {children}
        </code>
    ),
    pre: ({ children }) => (
        <pre className="bg-gray-100 p-2 rounded overflow-x-auto">
            {children}
        </pre>
    ),
    ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
    li: ({ children }) => <li className="mb-1">{children}</li>,
}

export function MCPMessage({ message }: Props) {
    const isUser = message.role === 'user'

    return (
        <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
            {/* Avatar */}
            <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                isUser ? 'bg-blue-500' : 'bg-gray-700'
            )}>
                {isUser ? (
                    <User className="w-5 h-5 text-white" />
                ) : (
                    <Bot className="w-5 h-5 text-white" />
                )}
            </div>

            {/* Content */}
            <div className={cn(
                'max-w-3xl',
                isUser && 'text-right'
            )}>
                <div className={cn(
                    'inline-block px-4 py-2 rounded-lg text-left',
                    isUser
                        ? 'bg-blue-500 text-white'
                        : 'bg-white border border-gray-200'
                )}>
                    <div className={cn(
                        'text-sm',
                        isUser ? 'text-white' : 'text-gray-900'
                    )}>
                        <ReactMarkdown components={markdownComponents}>
                            {message.content}
                        </ReactMarkdown>
                    </div>
                </div>

                {/* Tool Calls */}
                {message.tool_calls && message.tool_calls.length > 0 && (
                    <div className="mt-2 space-y-2">
                        {message.tool_calls.map((call, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-gray-600">
                                    Executed: <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                                        {call.name}
                                    </code>
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                <p className="text-xs text-gray-400 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                </p>
            </div>
        </div>
    )
}