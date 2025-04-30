'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import UserDropdown from "@/components/user-dropdown";
import FeedbackDialog from "@/components/feedback-dialog";
import { RiScanLine } from "@remixicon/react";
import { useState } from "react";

export function Header() {
  // Simulated sidebar state toggle (replace with global state if available)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleSidebarToggle = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 ml-66 shrink-0 items-center gap-2 border-b bg-slate-100/90 backdrop-blur supports-[backdrop-filter]:bg-slate-100/75 pl-0">
      <div className="flex w-full items-center gap-2 px-4">

        {/* Left section - aligns with sidebar */}
        <div className="flex items-center gap-2">
          
          {/* Sidebar trigger with dynamic tooltip */}
          <div className="relative group">
            <button onClick={handleSidebarToggle}>
              <SidebarTrigger className="-ml-2 p-1" />
            </button>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 scale-95 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-50">
              {isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            </div>
          </div>

          {/* Divider between sidebar and breadcrumb */}
          <Separator orientation="vertical" className="mr-2 h-4" />

          {/* Breadcrumb navigation with tooltip on Statistics icon */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <div className="relative group">
                  <BreadcrumbLink href="/statistics">
                    <RiScanLine size={22} aria-hidden="true" />
                    <span className="sr-only">Dashboard</span>
                  </BreadcrumbLink>
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 scale-95 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-50">
                    Go to statistics
                  </div>
                </div>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Researchers</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Right section - user controls */}
        <div className="ml-auto flex items-center gap-2">
          <FeedbackDialog />
          <UserDropdown />
        </div>
      </div>
    </header>
  );
}
