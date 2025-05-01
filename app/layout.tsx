// app/layout.tsx
// import { LazyMotion, domAnimation } from "framer-motion";
import { SessionProvider } from "next-auth/react"
import { Toaster } from "sonner" // Changed import
import { LanguageProvider } from '@/components/language-provider'
import { LayoutWrapper } from "@/components/layout-wrapper"
import "./globals.css"
import FloatingChatbot from "@/components/FloatingChatbot.tsx"

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  // ${fontSans.variable} font-sans antialiased
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