
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Bot, Twitch, BookText, Settings, Users, Globe, Radio, Shuffle, Menu, LayoutGrid, ScrollText, Clock } from 'lucide-react';
import DiscordLogo from '@/components/icons/discord-logo';
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
    { href: "/dashboard", icon: <Home className="h-5 w-5" />, label: "Dashboard" },
    { href: "/launcher-ui", icon: <LayoutGrid className="h-5 w-5" />, label: "Creator Station" },
    { href: "/access-control", icon: <Users className="h-5 w-5" />, label: "Access Control" },
    { href: "/spacemountain", icon: <Globe className="h-5 w-5" />, label: "Website" },
    { href: "#", icon: <Clock className="h-5 w-5" />, label: "Time Converter" },
    { href: "#", icon: <ScrollText className="h-5 w-5" />, label: "Lore Weaver" },
    { href: "#", icon: <div className="h-5 w-5 flex items-center justify-center"><DiscordLogo className="h-5 w-5" /></div>, label: "Discord" },
    { href: "#", icon: <Bot className="h-5 w-5" />, label: "Chat Bot" },
    { href: "#", icon: <Twitch className="h-5 w-5" />, label: "Twitch" },
    { href: "#", icon: <Radio className="h-5 w-5" />, label: "Streamer.bot" },
    { href: "#", icon: <BookText className="h-5 w-5" />, label: "Logs" },
    { href: "#", icon: <Shuffle className="h-5 w-5" />, label: "Fallback Strategy" },
    { href: "#", icon: <Settings className="h-5 w-5" />, label: "Settings" },
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
