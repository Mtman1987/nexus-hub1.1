import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/components/providers/app-provider';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider } from '@/components/ui/sidebar';
import { MainSidebar } from '@/components/layout/main-sidebar';
import { SidebarInset } from '@/components/ui/sidebar';

export const metadata: Metadata = {
  title: 'Apo Navigator',
  description: 'Navigate your life goals.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <AppProvider>
          <SidebarProvider>
            <div className="flex min-h-screen w-full">
              <MainSidebar />
              <SidebarInset>{children}</SidebarInset>
            </div>
            <Toaster />
          </SidebarProvider>
        </AppProvider>
      </body>
    </html>
  );
}
