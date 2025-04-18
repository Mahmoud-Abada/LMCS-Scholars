"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { SearchForm } from "@/components/search-form";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  RiScanLine,
  RiBardLine,
  RiUserFollowLine,
  RiCodeSSlashLine,
  RiLoginCircleLine,
  RiSettings3Line,
  RiLeafLine,
  RiLogoutBoxLine,
  RiArticleLine,
  RiBarChartHorizontalFill,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiArrowUpLine,
  RiArrowDownLine,
} from "@remixicon/react";

// ... (keep your existing data constant)
const data = {
  teams: [
    {
      name: "LMCS Scholars",
      logo: "/images/lmcs.jpg",
    },
  ],
  navMain: [
    {
      title: "Sections",
      url: "#",
      items: [
        {
          title: "Researchers",
          url: "#",
          icon: RiUserFollowLine,
          isActive: true,
        },
        {
          title: "Publications",
          url: "#",
          icon: RiArticleLine,
        },
        {
          title: "Stats",
          url: "#",
          icon: RiScanLine,
        },
        {
          title: "Insights",
          url: "#",
          icon: RiBardLine,
        },
        {
          title: "Reports",
          url: "#",
          icon: RiBarChartHorizontalFill,
        },
        {
          title: "Tools",
          url: "#",
          icon: RiCodeSSlashLine,
        },
        {
          title: "Integration",
          url: "#",
          icon: RiLoginCircleLine,
        },
      ],
    },
    {
      title: "Other",
      url: "#",
      items: [
        {
          title: "Settings",
          url: "#",
          icon: RiSettings3Line,
        },
        {
          title: "Help Center",
          url: "#",
          icon: RiLeafLine,
        },
      ],
    },
  ],
};
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showScrollUp, setShowScrollUp] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Check scroll position
  useEffect(() => {
    const checkScroll = () => {
      if (contentRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
        setShowScrollUp(scrollTop > 0);
        setShowScrollDown(scrollTop < scrollHeight - clientHeight);
      }
    };

    checkScroll();
    contentRef.current?.addEventListener('scroll', checkScroll);
    return () => contentRef.current?.removeEventListener('scroll', checkScroll);
  }, []);

  const scrollUp = () => {
    contentRef.current?.scrollBy({ top: -100, behavior: 'smooth' });
  };

  const scrollDown = () => {
    contentRef.current?.scrollBy({ top: 100, behavior: 'smooth' });
  };

  if (isCollapsed) {
    return (
      <button 
        onClick={() => setIsCollapsed(false)}
        className="fixed left-0 top-30 z-50 p-2 bg-[#d2e8ff] text-gray-800 rounded-r-md shadow-lg hover:bg-blue-500/30 transition-all duration-300 transform hover:translate-x-1"
      >
        <RiArrowRightLine size={24} />
      </button>
    );
  }

  return (
    <Sidebar 
      {...props} 
      className="!bg-[#d2e8ff] text-gray-800 !fixed h-screen overflow-y-hidden transition-all duration-300"
    >
      {/* Toggle button */}
      <button 
        onClick={() => setIsCollapsed(true)}
        className="absolute -right-4 top-4 z-50 p-1 bg-[#d2e8ff] text-gray-800 rounded-full shadow-lg hover:bg-blue-500/30 transition-all duration-300 border-2 border-gray-300 hover:scale-110"
      >
        <RiArrowLeftLine size={20} />
      </button>

      <SidebarHeader className="px-2 pt-2 pb-0 !bg-[#d2e8ff]">
        <div className="flex flex-col items-center transition-all duration-300">
          <img 
            src="/images/lmcs.jpg" 
            alt="LMCS Laboratory" 
            className="h-24 w-auto max-w-[180px] object-contain mb-3 rounded-lg transition-all duration-300 hover:scale-105" 
          />
          <span className="text-lg font-semibold text-gray-800">LMCS Scholars</span>
        </div>
        <hr className="border-t border-blue-500 mx-2 -mt-px my-4" />
        <SearchForm className="mt-0" />
      </SidebarHeader>

      {/* Scroll up button - only shows when needed */}
      {showScrollUp && (
        <button 
          onClick={scrollUp}
          className="absolute right-4 top-40 z-10 p-2 bg-blue-500/50 text-gray-800 rounded-full w-8 h-8 flex items-center justify-center hover:bg-blue-500/70 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <RiArrowUpLine size={16} />
        </button>
      )}

      <SidebarContent 
        ref={contentRef}
        className="!bg-[#d2e8ff] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-4 px-2 transition-all duration-300"
      >
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel className="uppercase text-gray-600">
              {item.title}
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-2">
              <SidebarMenu>
                {item.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className="group/menu-button font-medium gap-3 h-9 rounded-md hover:bg-blue-500/30 data-[active=true]:bg-blue-600 [&>svg]:size-auto transition-all duration-200"
                      isActive={item.isActive}
                    >
                      <a href={item.url}>
                        {item.icon && (
                          <item.icon
                            className="text-gray-700 group-data-[active=true]/menu-button:text-white transition-all duration-200"
                            size={22}
                            aria-hidden="true"
                          />
                        )}
                        <span className="text-gray-800 group-data-[active=true]/menu-button:text-white transition-all duration-200">
                          {item.title}
                        </span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Scroll down button - only shows when needed */}
      {showScrollDown && (
        <button 
          onClick={scrollDown}
          className="absolute right-4 bottom-24 z-10 p-2 bg-blue-500/50 text-gray-800 rounded-full w-8 h-8 flex items-center justify-center hover:bg-blue-500/70 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <RiArrowDownLine size={16} />
        </button>
      )}

      <SidebarFooter className="!bg-[#d2e8ff] transition-all duration-300">
        <hr className="border-t border-blue-500 mx-2 -mt-px" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="font-medium gap-3 h-9 rounded-md hover:bg-blue-500/30 [&>svg]:size-auto transition-all duration-200">
              <RiLogoutBoxLine
                className="text-gray-700 transition-all duration-200"
                size={22}
                aria-hidden="true"
              />
              <span className="text-gray-800 transition-all duration-200">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  );
}