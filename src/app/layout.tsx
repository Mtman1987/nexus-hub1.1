
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { LogProvider } from '@/context/LogContext';
import { BotNameProvider } from '@/context/BotNameContext';
import { SidebarProvider } from '@/context/SidebarContext';
import { ControlPanelProvider } from '@/context/ControlPanelContext';
import { DashboardLayout } from '@/components/layout/dashboard-layout';


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
                <DashboardLayout>
                  {children}
                </DashboardLayout>
              </ControlPanelProvider>
            </SidebarProvider>
          </BotNameProvider>
        </LogProvider>
        <Toaster />
      </body>
    </html>
  );
}
