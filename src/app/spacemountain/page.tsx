
import { WebsiteViewer } from '@/components/dashboard/website-viewer';
import { Globe } from 'lucide-react';

export default function SpaceMountainPage() {
  return (
    <div className="flex min-h-screen w-full bg-card/80 text-foreground p-4 lg:p-6">
       <div className="bg-theme"></div>
       <div className="w-full h-screen flex flex-col">
            <header className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-title-foreground">
                    <Globe className="h-8 w-8 text-primary" />
                     Website Control Panel
                </h1>
                <p className="text-muted-foreground mt-2">
                   Use the controls below to view and interact with your live websites directly from Apollo Station. This module is running in a standalone window.
                </p>
            </header>
            <main className="flex-grow">
                <WebsiteViewer />
            </main>
       </div>
    </div>
  );
}
