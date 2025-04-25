"use client";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"; // Assuming shadcn/ui is used

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  RiLogoutBoxLine,
  RiSettingsLine,
  RiTeamLine,
} from "@remixicon/react";
import { useSession, signOut } from "next-auth/react";


// Generates a pastel background color based on string
function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 80%)`;
}

export default function UserDropdown() {
  const { data: session } = useSession();

  const user = session?.user;
  const name = user?.name || "User";
  const email = user?.email || "";
  const image = user?.image || "";
  const initial = name.charAt(0).toUpperCase();
  const [showChangePassword, setShowChangePassword] = useState(false);


  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
          <Avatar className="size-8">
            <AvatarImage src={image} alt="Profile image" />
            <AvatarFallback
              className="font-semibold text-sm text-white"
              style={{ backgroundColor: stringToColor(name) }}
            >
              {initial}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-w-64" align="end">
        <DropdownMenuLabel className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-foreground">
            {name}
          </span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            {email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>

        <DropdownMenuItem onClick={() => setShowChangePassword(true)}>
  <RiSettingsLine size={16} className="opacity-60" />
  <span>Change Password</span>
</DropdownMenuItem>


          <DropdownMenuItem>
            <RiTeamLine size={16} className="opacity-60" />
            <span>Community area</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
          <RiLogoutBoxLine size={16} className="opacity-60" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Change Password</DialogTitle>
      </DialogHeader>
      <ChangePasswordForm />
    </DialogContent>
  </Dialog>
  </>
  
    
  );
}
