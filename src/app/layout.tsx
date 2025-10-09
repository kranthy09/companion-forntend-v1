// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter, Crimson_Text } from 'next/font/google'
import { AuthProvider } from '@/components/providers/auth-provider'
import { AppLayout } from '@/components/layout/app-layout'
import { cn } from "@/lib/utils"
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
})

const crimson = Crimson_Text({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-crimson',
  display: 'swap'
})

export const metadata: Metadata = {
  title: 'Companion - Your Writing Assistant',
  description: 'AI-powered note-taking and writing companion',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${crimson.variable}`}>
      <body
        className={cn(
          "min-h-screen font-sans antialiased",
          // 🧊 Cool gradient background
          "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100",
          // 🌙 Dark mode alternative
          "dark:from-slate-900 dark:via-slate-950 dark:to-blue-950"
        )}
      >
        <AuthProvider>
          <AppLayout>{children}</AppLayout>
        </AuthProvider>
      </body>
    </html>
  )
}