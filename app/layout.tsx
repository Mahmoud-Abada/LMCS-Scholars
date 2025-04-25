// app/layout.tsx
// import { LazyMotion, domAnimation } from "framer-motion";
import { SessionProvider } from "next-auth/react"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
// import { Footer } from "@/components/footer"
import { LanguageProvider } from '@/components/language-provider'
import { LayoutWrapper } from "@/components/layout-wrapper"
import { Header } from "@/components/header"
import "./globals.css"

// const fontSans = Inter({
//   subsets: ["latin"],
//   variable: "--font-sans"
// })

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
                {/* <Header />  Added Header component here */}
                 
                    {children}
                         
              </LayoutWrapper>
            </div>
           
            <Toaster />
          </SessionProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}