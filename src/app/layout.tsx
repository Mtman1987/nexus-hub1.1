
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
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="font-body antialiased text-foreground flex h-screen w-screen overflow-hidden bg-background">
        <LogProvider>
          <BotNameProvider>
            <SidebarProvider>
              <ControlPanelProvider>
                <div className="flex flex-1">
                    <Sidebar />
                    <div className="flex flex-col flex-1 h-screen overflow-hidden">
                       <Header />
                        <main className="flex-1 overflow-y-auto overflow-x-hidden">
                          {children}
                        </main>
                    </div>
                    <ControlPanel />
                </div>
              </ControlPanelProvider>
            </SidebarProvider>
          </BotNameProvider>
        </LogProvider>
        <Toaster />
      </body>
    </html>
  );
}
