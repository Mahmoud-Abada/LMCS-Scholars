"use client";

import * as React from "react";
import { useState } from "react";
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
  RiUserFollowLine,
  RiArticleLine,
  RiScanLine,
  RiBardLine,
  RiBarChartHorizontalFill,
  RiSettings3Line,
  RiLogoutBoxLine,
  RiArrowLeftLine,
  RiArrowRightLine,
} from "@remixicon/react";
import { usePathname } from "next/navigation";

export function AppSidebar() {
  // const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    {
      group: "SECTIONS",
      items: [
        {
          title: "Researchers",
          url: "/researchers",
          icon: RiUserFollowLine,
        },
        {
          title: "Publications",
          url: "/publications",
          icon: RiArticleLine,
        },
        {
          title: "Stats",
          url: "/statistics",
          icon: RiScanLine,
        },
        {
          title: "About LMCS",
          url: "/about",
          icon: RiBardLine,
        },
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: RiBarChartHorizontalFill,
        },
      ],
    },
    {
      group: "ACCOUNT",
      items: [
        {
          title: "Settings",
          url: "/settings",
          icon: RiSettings3Line,
        },
        {
          title: "Sign Out",
          url: "/login",
          icon: RiLogoutBoxLine,
        },
      ],
    },
  ];

  // if (isCollapsed) {
  //   return (
  //     <button 
  //       onClick={() => setIsCollapsed(false)}
  //       className="fixed left-0 top-30 z-50 p-2 bg-[#d2e8ff] text-gray-800 rounded-r-md shadow-lg hover:bg-blue-500/30 transition-all duration-300 transform hover:translate-x-1"
  //     >
  //       <RiArrowRightLine size={24} />
  //     </button>
  //   );
  // }

  return (
    <Sidebar className="!bg-[#d2e8ff] text-gray-800 !fixed h-screen">
      <SidebarHeader className="px-4 pt-4 !bg-[#d2e8ff]">
        <div className="flex flex-col items-center">
          <img 
            src="/images/lmcs.jpg" 
            alt="LMCS Laboratory" 
            className="h-14 w-auto mb-3 rounded-lg" 
          />
          <h1 className="text-xl font-bold text-gray-800">LMCS Scholars</h1>
        </div>
      </SidebarHeader>

      <SidebarContent className="!bg-[#d2e8ff] px-3 py-4">
        {menuItems.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel className="uppercase text-gray-600 text-sm font-bold mb-2">
              {group.group}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`font-semibold gap-3 h-10 rounded-md hover:bg-blue-500/30 text-base ${
                        pathname.startsWith(item.url) ? 'bg-blue-600 text-white ' : ''
                      }`}
                    >
                      <a href={item.url}>
                        <item.icon
                          size={22}
                          className={pathname.startsWith(item.url) ? 'text-white' : 'text-gray-700'}
                        />
                        <span className="underline-offset-1">{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* <button 
        onClick={() => setIsCollapsed(true)}
        className="absolute right-3 top-4 p-1 text-gray-700 hover:text-gray-900"
      >
        <RiArrowLeftLine size={20} />
      </button> */}
    </Sidebar>
  );
}