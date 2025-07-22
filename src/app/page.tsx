
"use client";

import { useEffect, useState } from 'react';
import DashboardPage from './dashboard/page';
import { SetupDialog } from '@/components/dashboard/setup-dialog';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const [needsSetup, setNeedsSetup] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // This check runs only on the client-side
    const key = localStorage.getItem('edenApiKey');
    setNeedsSetup(!key);
    setIsChecking(false);
  }, []);

  if (isChecking) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <DashboardPage />
      <SetupDialog 
        open={needsSetup} 
        onOpenChange={setNeedsSetup} 
      />
    </>
  );
}
