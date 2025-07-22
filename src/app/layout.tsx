
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { LogProvider } from '@/context/LogContext';
import { BotNameProvider } from '@/context/BotNameContext';
import { SidebarProvider } from '@/context/SidebarContext';
import { MobileSidebar } from '@/components/layout/mobile-sidebar';
import { Sidebar } from '@/components/layout/sidebar';

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
        <meta name="theme-color" content="#1A1A1A" />
      </head>
      <body className="font-body antialiased text-foreground">
        <div className="planet"></div>
        <div className="shooting-star" style={{ top: '10vh', left: '40vw', animationDelay: '-1s' }}></div>
        <div className="shooting-star" style={{ top: '50vh', left: '60vw', animationDelay: '-3.4s' }}></div>
        <div className="shooting-star" style={{ top: '80vh', left: '90vw', animationDelay: '-5.8s' }}></div>
        <div className="shooting-star-reverse" style={{ top: '20vh', left: '10vw', animationDelay: '-2.2s' }}></div>
        <div className="shooting-star-reverse" style={{ top: '60vh', left: '80vw', animationDelay: '-4.1s' }}></div>
        <div className="shooting-star-reverse" style={{ top: '90vh', left: '30vw', animationDelay: '-0.5s' }}></div>
        <LogProvider>
          <BotNameProvider>
            <SidebarProvider>
              <div className="flex min-h-screen w-full">
                <Sidebar />
                <div className="md:hidden p-4">
                  <MobileSidebar />
                </div>
                <main className="flex-1 flex flex-col overflow-auto">
                  {children}
                </main>
              </div>
            </SidebarProvider>
          </BotNameProvider>
        </LogProvider>
        <Toaster />
      </body>
    </html>
  );
}

    