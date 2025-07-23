
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SetupDialog } from '@/components/dashboard/setup-dialog';
import { Rocket, Settings } from 'lucide-react';
import { useBotName } from '@/context/BotNameContext';
import { CommunityLogo } from '@/components/icons/community-logo';

export default function LauncherPage() {
  const router = useRouter();
  const [showSetup, setShowSetup] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(true);
  const { botName } = useBotName();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Check for the primary required key to determine if setup is needed.
    const hasApiKey = !!localStorage.getItem('edenApiKey');
    setIsSetupComplete(hasApiKey);
    if (!hasApiKey) {
      setShowSetup(true);
    }
  }, []);

  const handleLaunch = () => {
    router.push('/dashboard');
  };

  if (!isMounted) {
    return null; // Prevent server-side rendering
  }

  return (
    <>
      <SetupDialog open={showSetup} onOpenChange={setShowSetup} />
      <div className="flex h-screen w-screen items-center justify-center text-foreground">
        <div className="relative flex flex-col items-center gap-6 text-center p-8 rounded-lg max-w-md mx-auto">
            <CommunityLogo className="w-24 h-auto" />
          
          <div className="space-y-2">
             <h1 className="text-4xl font-bold tracking-tighter text-title-foreground">Apollo Station</h1>
             <p className="text-muted-foreground">
                {botName}'s command center is standing by. All systems ready for launch.
             </p>
          </div>
          
          <Button size="lg" onClick={handleLaunch} className="w-full">
            <Rocket className="mr-2 h-5 w-5" />
            Launch Dashboard
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => setShowSetup(true)} className="w-full">
            <Settings className="mr-2 h-4 w-4" />
            {isSetupComplete ? 'Re-run Setup Wizard' : 'Start Setup'}
          </Button>
        </div>
      </div>
    </>
  );
}
