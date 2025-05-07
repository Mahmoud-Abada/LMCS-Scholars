"use client";

import * as React from "react";
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
} from "@/components/ui/sidebar";
import {
  RiUserFollowLine,
  RiArticleLine,
  RiScanLine,
  RiBardLine,
  RiBarChartHorizontalFill,
  RiSettings3Line,
  RiLogoutBoxLine,
  RiUserLine,
  RiTeamLine,
} from "@remixicon/react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import Image from "next/image";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: "admin" | "researcher" | "guest";
  researcherId?: string | null;
}

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const user = session?.user as User | undefined;
  const isResearcher = user?.role === "researcher";

  // Determine active item based on exact or startsWith match
  const isActive = (url: string) => {
    // Special case for researcher profile to avoid conflict with researchers list
    if (url.startsWith("/researchers/") && pathname.startsWith("/researchers/")) {
      return pathname === url; // Exact match for profile
    }
    return pathname === url || pathname.startsWith(url + "/");
  };

  if (status === "loading") {
    return (
      <Sidebar className="!bg-[#d2e8ff] text-gray-800 !fixed h-screen">
        <SidebarContent className="flex items-center justify-center">
          <div className="animate-pulse">Chargement...</div>
        </SidebarContent>
      </Sidebar>
    );
  }

  const menuItems = [
    ...(isResearcher
      ? [
          {
            group: "MON PROFIL",
            items: [
              {
                title: "Mon Profil",
                url: `/researcher/${user?.researcherId}`,
                icon: RiUserLine,
                exact: true, // Requires exact match
              },
            ],
          },
        ]
      : []),
    
    {
      group: "SECTIONS",
      items: [
        {
          title: "Accueil",
          url: "/",
          icon: RiTeamLine,
        },
        
        {
          title: "Publications",
          url: "/publications",
          icon: RiArticleLine,
        },
        {
          title: "Statistiques",
          url: "/stats",
          icon: RiScanLine,
        },
        {
          title: "chercheurs",
          url: "/dashboard",
          icon: RiBarChartHorizontalFill,
        },
        {
          title: "À propos",
          url: "/about",
          icon: RiBardLine,
        },
      ],
    },
    // {
    //   group: "COMPTE",
    //   items: [
    //     {
    //       title: "Paramètres",
    //       url: "/settings",
    //       icon: RiSettings3Line,
    //     },
    //     {
    //       title: "Déconnexion",
    //       url: "#",
    //       icon: RiLogoutBoxLine,
    //       onClick: () => signOut({ callbackUrl: "/login" }),
    //     },
    //   ],
    // },
  ];

  return (
    <Sidebar className="!bg-[#d2e8ff] text-gray-800 !fixed h-screen border-r border-blue-300">
      <SidebarHeader className="px-4 pt-4 !bg-[#d2e8ff] border-b border-blue-300 pb-4">
        <div className="flex flex-col items-center">
          <div className="relative h-13 w-20 mb-1   rounded-lg ">
            <Image
              src={user?.image || "/images/lmcs.jpg"}
              alt="Profile"
              className="object-cover"
              fill
              sizes="70px"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">LMCS Scholars</h1>
          {user && (
            <div className="text-center mt-2">
              <p className="text-base font-semibold text-gray-800">
                {user.name || "Utilisateur"}
              </p>
              <p className="text-sm text-blue-600 font-medium">
                {user.role === "researcher"
                  ? "Chercheur"
                  : user.role === "admin"
                  ? "Administrateur"
                  : "vous êtes connecté"}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="!bg-[#d2e8ff] px-4 py-6 space-y-6">
        {menuItems.map((group, groupIndex) => (
          <React.Fragment key={group.group}>
            <SidebarGroup>
              <SidebarGroupLabel className="uppercase text-gray-600 text-sm font-bold mb-2 tracking-wider">
                {group.group}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={`font-semibold gap-2 h-9 rounded-lg hover:bg-blue-500/30 text-base transition-colors duration-200 ${
                          isActive(item.url)
                            ? "bg-blue-600 text-white hover:bg-blue-600 shadow-md"
                            : "hover:text-blue-800"
                        }`}
                      >
                        <a
                          href={item.url}
                          onClick={(e) => {
                            if (item.onClick) {
                              e.preventDefault();
                              item.onClick();
                            }
                          }}
                          className="px-2"
                        >
                          <item.icon
                            size={22}
                            className={
                              isActive(item.url)
                                ? "text-white"
                                : "text-gray-700"
                            }
                          />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            
            {/* Add separator between groups except after last one */}
            {groupIndex < menuItems.length - 1 && (
              <div className="border-t border-blue-300/50 my-0.5"></div>
            )}
          </React.Fragment>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-2 text-center text-sm text-gray-600 bg-blue-100 border-t border-blue-300 mb-4">
        <p className="font-medium">LMCS Laboratory © {new Date().getFullYear()}</p>
      </SidebarFooter>
    </Sidebar>
  );
}