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

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 ml-66 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pl-0"> {/* Added pl-10 to match sidebar width */}
      <div className="flex w-full items-center gap-2 px-4">
        {/* Left section - aligns with sidebar */}
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-2 p-1" />
          <Separator
            orientation="vertical"
            className="mr-2 h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">
                  <RiScanLine size={22} aria-hidden="true" />
                  <span className="sr-only">Dashboard</span>
                </BreadcrumbLink>
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