// src/components/features/mcp/mcp-tool-panel.tsx
import { Wrench, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import type { MCPTool } from '@/hooks/useMCPChat'

interface Props {
    tools: MCPTool[]
}

export function MCPToolPanel({ tools }: Props) {
    const [expanded, setExpanded] = useState<string | null>(null)

    return (
        <aside className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <Wrench className="w-5 h-5" />
                    Available Tools
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    {tools.length} tools available
                </p>
            </div>

            <div className="p-4 space-y-2">
                {tools.map((tool) => (
                    <div key={tool.name} className="border border-gray-200 rounded-lg">
                        <button
                            onClick={() => setExpanded(
                                expanded === tool.name ? null : tool.name
                            )}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                        >
                            <span className="font-medium text-sm">{tool.name}</span>
                            {expanded === tool.name ? (
                                <ChevronUp className="w-4 h-4" />
                            ) : (
                                <ChevronDown className="w-4 h-4" />
                            )}
                        </button>

                        {expanded === tool.name && (
                            <div className="px-4 pb-3 border-t border-gray-100">
                                <p className="text-sm text-gray-600 mt-2">
                                    {tool.description}
                                </p>
                                <div className="mt-2">
                                    <p className="text-xs font-semibold text-gray-700">
                                        Parameters:
                                    </p>
                                    <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                                        {JSON.stringify(tool.parameters, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </aside>
    )
}