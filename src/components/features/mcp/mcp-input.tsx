// src/components/features/mcp/mcp-input.tsx
import { useState, KeyboardEvent } from 'react'
import { Send } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
    onSend: (message: string) => void
    disabled?: boolean
}

export function MCPInput({ onSend, disabled }: Props) {
    const [input, setInput] = useState('')

    const handleSend = () => {
        if (!input.trim() || disabled) return
        onSend(input)
        setInput('')
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="border-t border-gray-200 bg-white p-4">
            <div className="max-w-4xl mx-auto flex gap-3">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about your data or request an action..."
                    disabled={disabled}
                    className={cn(
                        'flex-1 resize-none rounded-lg border border-gray-300 px-4 py-3',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500',
                        'disabled:opacity-50'
                    )}
                    rows={3}
                />
                <button
                    onClick={handleSend}
                    disabled={disabled || !input.trim()}
                    className={cn(
                        'px-6 py-3 bg-blue-500 text-white rounded-lg',
                        'hover:bg-blue-600 transition-colors',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        'flex items-center gap-2'
                    )}
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">
                Press Enter to send, Shift+Enter for new line
            </p>
        </div>
    )
}