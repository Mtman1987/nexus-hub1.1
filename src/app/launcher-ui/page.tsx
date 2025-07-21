
"use client";

import { useEffect, useRef, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket } from 'lucide-react';
import { SetupDialog } from '@/components/dashboard/setup-dialog';

const OPEN_POPOUTS_KEY = 'apollo-open-popouts';


export default function LauncherUIPage() {
  const dashboardRef = useRef<Window | null>(null);
  const [buttonText, setButtonText] = useState('Launch Apollo Station');
  const [showSetup, setShowSetup] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Check if essential API key is missing to trigger the setup
    const key = localStorage.getItem('edenApiKey');
    if (!key) {
      setShowSetup(true);
    }
  }, []);

  const launchDashboard = useCallback(() => {
    if (dashboardRef.current && !dashboardRef.current.closed) {
      dashboardRef.current.focus();
      return;
    }

    const { availLeft, availTop, availWidth, availHeight } = window.screen;
    const halfWidth = Math.floor(availWidth / 2);
    const features = `width=${halfWidth},height=${availHeight},left=${leftPos},top=${availTop},resizable,scrollbars`;
    
    // Position the dashboard on the right half of the screen
    const leftPos = availLeft + halfWidth;

    const newDashboard = window.open('/dashboard', 'apollo_dashboard', features);
    if (newDashboard) {
      dashboardRef.current = newDashboard;
    }
  }, []);

  const handleManualLaunch = () => {
    // Clear any previously saved popout locations when doing a fresh launch.
    localStorage.removeItem(OPEN_POPOUTS_KEY);
    launchDashboard();
  };

  useEffect(() => {
    const checkDashboardClosed = setInterval(() => {
        if (dashboardRef.current && dashboardRef.current.closed) {
            dashboardRef.current = null;
        }
    }, 1000);

    return () => {
      clearInterval(checkDashboardClosed);
    };
  }, []);

  // Render nothing on the server, wait for client-side check
  if (!isClient) {
    return null; 
  }

  if (showSetup) {
    return <SetupDialog open={showSetup} onOpenChange={setShowSetup} />;
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Rocket className="h-7 w-7 text-primary" />
            Apollo Station Launcher
          </CardTitle>
          <CardDescription>
            Your command center awaits. Keep this window open to manage pop-out windows.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Click to launch your main dashboard.
          </p>
          <Button onClick={handleManualLaunch} className="w-full text-md py-5">
            <Rocket className="mr-2 h-5 w-5" />
            Launch Apollo Station
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
