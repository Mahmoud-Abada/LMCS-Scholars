// app/layout.tsx
import { SessionProvider } from "next-auth/react"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import { Footer } from "@/components/footer"
import { LanguageProvider } from '@/components/language-provider'
import { LayoutWrapper } from "@/components/layout-wrapper"
import "./globals.css"

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans"
})

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark scheme-only-dark">
      <body className={`${fontSans.variable} font-sans antialiased`}>
        <LanguageProvider>
          <SessionProvider>
            <div className="flex min-h-screen">
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
            </div>
            {/* <Footer /> */}
            <Toaster />
          </SessionProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}