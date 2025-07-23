
"use client";

import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Rocket } from "lucide-react";
import { SidebarNav } from "./sidebar-nav";
import { useSidebar } from "@/context/SidebarContext";

export function MobileSidebar() {
  const { isMobileMenuOpen, setMobileMenuOpen } = useSidebar();
  
  return (
    <Sheet open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col p-0">
         <SheetHeader className="flex h-14 items-center border-b px-4 lg:h-[60px]">
            <SheetTitle>
              <div className="flex items-center gap-2 font-semibold text-primary">
                  <Rocket className="h-6 w-6" />
                  <span>Apollo Station</span>
              </div>
            </SheetTitle>
        </SheetHeader>
        <SidebarNav isMobile={true} />
      </SheetContent>
    </Sheet>
  )
}
