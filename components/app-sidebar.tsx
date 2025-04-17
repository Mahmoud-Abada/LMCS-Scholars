import * as React from "react";

import { SearchForm } from "@/components/search-form";
import { TeamSwitcher } from "@/components/team-switcher";
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
} from "@remixicon/react";

// This is sample data.
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
  return (
    <Sidebar {...props} className="!bg-[#d2e8ff] text-gray-800 !fixed h-screen overflow-y-hidden">
      <SidebarHeader className="px-2 pt-2 pb-0 !bg-[#d2e8ff]">
        <div className="flex flex-col items-center">
          <img 
            src="/images/lmcs.jpg" 
            alt="LMCS Laboratory" 
            className="h-24 w-auto max-w-[180px] object-contain mb-3 rounded-lg" 
          />
          <span className="text-lg font-semibold text-gray-800">LMCS Scholars</span>
        </div>
        
        <hr className="border-t border-blue-500 mx-2 -mt-px my-4" />
        <SearchForm className="mt-0" />
      </SidebarHeader>
      
      <SidebarContent className="!bg-[#d2e8ff] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
                      className="group/menu-button font-medium gap-3 h-9 rounded-md hover:bg-blue-500/30 data-[active=true]:bg-blue-600 [&>svg]:size-auto"
                      isActive={item.isActive}
                    >
                      <a href={item.url}>
                        {item.icon && (
                          <item.icon
                            className="text-gray-700 group-data-[active=true]/menu-button:text-white"
                            size={22}
                            aria-hidden="true"
                          />
                        )}
                        <span className="text-gray-800 group-data-[active=true]/menu-button:text-white">
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
      
      <SidebarFooter className="!bg-[#d2e8ff]">
        <hr className="border-t border-blue-500 mx-2 -mt-px" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="font-medium gap-3 h-9 rounded-md hover:bg-blue-500/30 [&>svg]:size-auto">
              <RiLogoutBoxLine
                className="text-gray-700"
                size={22}
                aria-hidden="true"
              />
              <span className="text-gray-800">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  );
}