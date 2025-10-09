// src/components/ui/card.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export const Card = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "rounded-xl border border-gray-200 bg-white shadow-sm transition-all dark:border-gray-800 dark:bg-gray-900 hover:shadow-md hover:border-blue-500/50",
            className
        )}
        {...props}
    />
))
Card.displayName = "Card"

export const CardHeader = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("p-4 border-b border-gray-100 dark:border-gray-800", className)} {...props} />
)

export const CardTitle = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
        className={cn("text-lg font-semibold text-gray-800 dark:text-gray-100 line-clamp-2", className)}
        {...props}
    />
)

export const CardContent = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("p-4 text-gray-700 dark:text-gray-300", className)} {...props} />
)
