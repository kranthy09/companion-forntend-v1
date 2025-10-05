// src/components/features/notes/summary-display.tsx
import { FileText, Sparkles, CheckCircle } from 'lucide-react'

interface SummaryDisplayProps {
    content: string
    isStreaming: boolean
}

export function SummaryDisplay({ content, isStreaming }: SummaryDisplayProps) {
    const parseSummary = (text: string) => {
        const sections = {
            executive: '',
            insights: '',
            conclusion: '',
        }

        const executiveMatch = text.match(
            /Executive Summary:?\s*([\s\S]*?)(?=Key Insights:|Conclusion:|$)/i
        )
        const insightsMatch = text.match(
            /Key Insights:?\s*([\s\S]*?)(?=Conclusion:|$)/i
        )
        const conclusionMatch = text.match(/Conclusion:?\s*([\s\S]*?)$/i)

        if (executiveMatch) sections.executive = executiveMatch[1].trim()
        if (insightsMatch) sections.insights = insightsMatch[1].trim()
        if (conclusionMatch) sections.conclusion = conclusionMatch[1].trim()

        return sections
    }

    const sections = parseSummary(content)
    const hasStructuredSections = sections.executive || sections.insights || sections.conclusion

    if (!content) return null

    if (isStreaming) {
        return (
            <div className="bg-white rounded-xl border-2 border-blue-200 p-6">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {content}
                    <span className="inline-block w-2 h-4 ml-1 bg-blue-600 animate-pulse" />
                </p>
            </div>
        )
    }

    if (hasStructuredSections) {
        return (
            <div className="space-y-4">
                {sections.executive && (
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-bold">Executive Summary</h3>
                        </div>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {sections.executive}
                        </p>
                    </div>
                )}

                {sections.insights && (
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-5 h-5 text-purple-600" />
                            <h3 className="text-lg font-bold">Key Insights</h3>
                        </div>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {sections.insights}
                        </p>
                    </div>
                )}

                {sections.conclusion && (
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <h3 className="text-lg font-bold">Conclusion</h3>
                        </div>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {sections.conclusion}
                        </p>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {content}
            </p>
        </div>
    )
}