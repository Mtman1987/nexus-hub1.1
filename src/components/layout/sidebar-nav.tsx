
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Globe, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type SidebarNavProps = ComponentProps<'nav'> & {
  isCollapsed?: boolean;
  isMobile?: boolean;
}

export function SidebarNav({ isCollapsed = false, isMobile = false, className }: SidebarNavProps) {
  const pathname = usePathname();

  const navClass = "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary";
  const activeClass = "bg-muted text-primary font-semibold";

  const navItems = [
    { href: "/", icon: <Home className="h-5 w-5" />, label: "Dashboard" },
    { href: "/access-control", icon: <Users className="h-5 w-5" />, label: "Access Control" },
    { href: "/spacemountain", icon: <Globe className="h-5 w-5" />, label: "Website Viewer" },
  ];

  if (isCollapsed) {
    return (
      <TooltipProvider>
        <nav className={cn("grid items-start gap-1 p-2 text-base font-medium lg:p-4 flex-grow", className)}>
          {navItems.map(item => (
            <Tooltip key={item.label} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link href={item.href} className={cn(navClass, "justify-center", pathname === item.href && activeClass)}>
                  {item.icon}
                  <span className="sr-only">{item.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                {item.label}
              </TooltipContent>
            </Tooltip>
          ))}
        </nav>
      </TooltipProvider>
    );
  }

  return (
      <nav className={cn("grid items-start gap-1 p-2 text-base font-medium lg:p-4 flex-grow", className)}>
        {navItems.map(item => (
          <Link key={item.label} href={item.href} className={cn(navClass, pathname === item.href && activeClass)} title={item.label}>
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
  );
}
