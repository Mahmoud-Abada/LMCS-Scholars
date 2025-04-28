// app/layout.tsx
import { SessionProvider } from "next-auth/react"
import { Inter } from "next/font/google"
import { Toaster } from "sonner" // Changed import
import { LanguageProvider } from '@/components/language-provider'
import { LayoutWrapper } from "@/components/layout-wrapper"
import { Header } from "@/components/header"
import "./globals.css"
import FloatingChatbot from "@/components/FloatingChatbot.tsx"

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark scheme-only-dark">
      <body className={``}>
        <LanguageProvider>
          <SessionProvider>
            <div className="flex min-h-screen">
              <LayoutWrapper>
                {children}
                <FloatingChatbot />
              </LayoutWrapper>
            </div>
           
            <Toaster position="bottom-right" richColors /> {/* Updated Toaster */}
          </SessionProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}