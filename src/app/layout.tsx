
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { LogProvider } from '@/context/LogContext';
import { BotNameProvider } from '@/context/BotNameContext';
import { SidebarProvider } from '@/context/SidebarContext';

export const metadata: Metadata = {
  title: 'Apollo Station',
  description: 'Apollo Station: Your Space Mountain HQ for managing all online services, by mtman1987.',
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
      <body className="font-body antialiased bg-background text-foreground">
        <LogProvider>
          <BotNameProvider>
            <SidebarProvider>
              {children}
            </SidebarProvider>
          </BotNameProvider>
        </LogProvider>
        <Toaster />
      </body>
    </html>
  );
}

    