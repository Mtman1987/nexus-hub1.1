
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { LogProvider } from '@/context/LogContext';
import { BotNameProvider } from '@/context/BotNameContext';
import { SidebarProvider } from '@/context/SidebarContext';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { ControlPanelProvider } from '@/context/ControlPanelContext';
import { ControlPanel } from '@/components/layout/control-panel';


export const metadata: Metadata = {
  title: 'Apollo Station',
  description: 'Apollo Station: Your central command for managing all online services, by mtman1987.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#000000" />
      </head>
      <body>
        <LogProvider>
          <BotNameProvider>
            <SidebarProvider>
              <ControlPanelProvider>
                <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
                    <Sidebar />
                    <div className="flex flex-col flex-1 overflow-hidden">
                       <Header />
                        <main className="flex-1 overflow-y-auto">
                          {children}
                        </main>
                    </div>
                </div>
                <ControlPanel />
              </ControlPanelProvider>
            </SidebarProvider>
          </BotNameProvider>
        </LogProvider>
        <Toaster />
      </body>
    </html>
  );
}
