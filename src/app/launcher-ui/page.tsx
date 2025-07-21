
"use client";

import { useEffect, useRef, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket } from 'lucide-react';

const RELAUNCH_KEY = 'nexus-relaunch-trigger';
const RELAUNCH_IN_PROGRESS_KEY = 'nexus-relaunch-in-progress';
const OPEN_POPOUTS_KEY = 'nexus-open-popouts';


export default function LauncherUIPage() {
  const dashboardRef = useRef<Window | null>(null);
  const [buttonText, setButtonText] = useState('Launch Nexus Hub');

  const launchDashboard = useCallback((isRelaunch: boolean) => {
    if (dashboardRef.current && !dashboardRef.current.closed) {
      dashboardRef.current.focus();
      return;
    }

    const { availLeft, availTop, availWidth, availHeight } = window.screen;
    let features: string;

    if (isRelaunch) {
        // Relaunch: bottom-right quadrant
        const dashboardWidth = Math.floor(availWidth / 2);
        // This calculation must match the popout height calculation precisely
        const dashboardHeight = Math.floor(availHeight / 2) - 60; 
        const leftPos = availLeft + dashboardWidth;
        const topPos = availTop + Math.floor(availHeight / 2);
        features = `width=${dashboardWidth},height=${dashboardHeight},left=${leftPos},top=${topPos},resizable,scrollbars`;
    } else {
        // Initial launch: right half of the screen
        const halfWidth = Math.floor(availWidth / 2);
        const leftPos = availLeft + halfWidth;
        features = `width=${halfWidth},height=${availHeight},left=${leftPos},top=${availTop},resizable,scrollbars`;
        setButtonText('Relaunch Dashboard');
    }

    const newDashboard = window.open('/dashboard', 'dashboard-b', features);
    if (newDashboard) {
      if (isRelaunch) {
          try {
            // This flag is crucial for Dashboard B to know it's part of the sequence.
            localStorage.setItem(RELAUNCH_IN_PROGRESS_KEY, 'true');
          } catch (e) {
            console.warn("Could not set relaunch flag on new dashboard window. It may have been blocked.", e);
          }
      }
      dashboardRef.current = newDashboard;
    }
  }, []);

  const handleManualLaunch = () => {
    localStorage.removeItem(OPEN_POPOUTS_KEY);
    launchDashboard(false);
  };

  useEffect(() => {
    // This is the new, more reliable polling mechanism.
    const relaunchCheckInterval = setInterval(() => {
        if (localStorage.getItem(RELAUNCH_KEY) === 'true') {
            localStorage.removeItem(RELAUNCH_KEY); // Consume the trigger
            launchDashboard(true);
        }
    }, 250); // Check every quarter second

    // Monitors the main dashboard window and resets the button text if it's closed manually.
    const checkDashboardClosed = setInterval(() => {
        if (dashboardRef.current && dashboardRef.current.closed) {
            dashboardRef.current = null;
            setButtonText('Launch Nexus Hub');
        }
    }, 1000);

    return () => {
      clearInterval(relaunchCheckInterval);
      clearInterval(checkDashboardClosed);
    };
  }, [launchDashboard]);


  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Rocket className="h-7 w-7 text-primary" />
            Nexus Hub Launcher
          </CardTitle>
          <CardDescription>
            Your command center awaits. Keep this window open.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Click to launch your dashboard. The app will auto-relaunch into a 2x2 grid when you open a third pop-out module.
          </p>
          <Button onClick={handleManualLaunch} className="w-full text-md py-5">
            <Rocket className="mr-2 h-5 w-5" />
            {buttonText}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
