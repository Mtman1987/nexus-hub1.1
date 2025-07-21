"use client";

import { useEffect, useState } from 'react';
import DashboardPage from './dashboard/page';
import { SetupDialog } from '@/components/dashboard/setup-dialog';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);

  useEffect(() => {
    // This check runs only on the client-side
    const key = localStorage.getItem('edenApiKey');
    setNeedsSetup(!key);
  }, []);

  if (needsSetup === null) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (needsSetup) {
    // The onOpenChange is set to a no-op because we don't want the user to close it.
    // It will disappear on its own after they finish and the page reloads.
    return <SetupDialog open={true} onOpenChange={() => {}} />;
  }

  return <DashboardPage />;
}
