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
import { RiScanLine, RiSearchLine } from "@remixicon/react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";

export function Header() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const [currentPage, setCurrentPage] = useState("Researchers");

  // Update current page based on pathname
  useEffect(() => {
    const pathSegments = pathname.split('/');
    const currentPath = pathSegments[1] || 'dashboard';
    const pageNames: Record<string, string> = {
      'researchers': 'Researchers',
      'publications': 'Publications',
      'statistics': 'Stats',
      'about': 'About LMCS',
      'dashboard': 'Dashboard',
      'settings': 'Settings'
    };
    setCurrentPage(pageNames[currentPath] || 'Dashboard');
  }, [pathname]);

  const handleSidebarToggle = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Searching for:", searchQuery);
  };

  // Highlight matching text in the page
  useEffect(() => {
    const highlightMatches = () => {
      // Remove old highlights
      document.querySelectorAll("mark[data-highlight]").forEach((el) => {
        const parent = el.parentNode;
        if (!parent) return;
        parent.replaceChild(document.createTextNode(el.textContent || ""), el);
        parent.normalize();
      });

      if (!searchQuery.trim()) return;

      const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
      const regex = new RegExp(`(${searchQuery})`, "gi");

      while (walk.nextNode()) {
        const node = walk.currentNode as Text;

        if (
          node.parentElement &&
          node.parentElement.tagName !== "SCRIPT" &&
          node.parentElement.tagName !== "STYLE" &&
          node.parentElement.getAttribute("data-no-highlight") !== "true" &&
          node.textContent &&
          regex.test(node.textContent)
        ) {
          const span = document.createElement("span");
          span.innerHTML = node.textContent.replace(regex, '<mark data-highlight>$1</mark>');
          node.parentElement.replaceChild(span, node);
        }
      }
    };

    highlightMatches();
  }, [searchQuery]);

  return (
    <header
      className={`sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-slate-100/90 backdrop-blur supports-[backdrop-filter]:bg-slate-100/75 transition-all duration-300 ${
        isSidebarOpen ? 'ml-66' : 'ml-0'
      }`}
    >
      <div className="flex w-full items-center gap-4 px-4">

        {/* Left section */}
        <div className="flex items-center gap-2">
          <div className="relative group">
            <button onClick={handleSidebarToggle}>
              <SidebarTrigger className="-ml-2 p-1" />
            </button>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 scale-95 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-50">
              {isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            </div>
          </div>

          <Separator orientation="vertical" className="mr-2 h-4" />

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
                <BreadcrumbPage>{currentPage}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Center - Search bar */}
        <div className="flex-1 max-w-2xl mx-4">
          <form onSubmit={handleSearch} className="relative">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search researchers, publications..."
              className="pl-10 pr-4 py-2 w-full rounded-lg bg-white border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          <FeedbackDialog />
          <UserDropdown />
        </div>
      </div>
    </header>
  );
}
