// components/layout-wrapper.tsx
'use client'

import { usePathname } from 'next/navigation'
import { AppSidebar } from "./app-sidebar"
import { SidebarProvider } from "./ui/sidebar"

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideSidebar = ['/login', '/register','/'].includes(pathname)

  return (
<SidebarProvider>
    <div className="flex min-h-screen w-full">
      {!hideSidebar && (
        
          <AppSidebar className="fixed left-0  top-0 h-full w-10 border-r" />
        )}
      <main className={`flex-1 ${!hideSidebar ? 'ml-0' : ''}`}>
        {children}
      </main>
    </div>
        </SidebarProvider>
  )
}