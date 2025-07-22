
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Monitor, RefreshCw, GripVertical, EyeOff } from 'lucide-react';
import { SITES } from '@/lib/sites';
import { useLogs } from '@/context/LogContext';
import { PopOutButton } from './pop-out-button';

interface WebsiteViewerProps {
  isPoppedOut?: boolean;
  onPopOut?: () => void;
  onHide?: () => void;
  dragHandleProps?: any;
  isPreview?: boolean;
}

export function WebsiteViewer({ isPoppedOut = false, onPopOut, onHide, dragHandleProps, isPreview }: WebsiteViewerProps) {
  const [activeTab, setActiveTab] = useState(Object.keys(SITES)[0]);
  const [iframeKey, setIframeKey] = useState(Date.now());
  const [currentUrl, setCurrentUrl] = useState(SITES[activeTab as keyof typeof SITES].url);
  const { addLog } = useLogs();

  useEffect(() => {
    if (isPreview) return;
    const channel = new BroadcastChannel('apollo-station-website-control');

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.action === 'youtube_search' && event.data.query) {
        addLog({
            service: 'Website Control',
            level: 'info',
            message: `Received command to search for: "${event.data.query}"`,
        });
        const newUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(event.data.query)}`;
        setCurrentUrl(newUrl);
        setIframeKey(Date.now()); // Force iframe reload
      }
    };

    channel.addEventListener('message', handleMessage);

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, [addLog, isPreview]);

  useEffect(() => {
      // When the active tab changes, reset the URL to that site's default
      const newUrl = SITES[activeTab as keyof typeof SITES].url;
      setCurrentUrl(newUrl);
      setIframeKey(Date.now());
  }, [activeTab]);


  const handleRefresh = () => {
    setIframeKey(Date.now());
  };
  
  const currentSite = SITES[activeTab as keyof typeof SITES];
  const siteKeys = Object.keys(SITES);

  return (
    <Card className="h-full flex flex-col bg-card/80">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
             <div className="flex items-center gap-2 flex-grow">
               <Button variant="ghost" size="icon" {...dragHandleProps} className="cursor-grab p-1 h-auto w-auto">
                <GripVertical />
              </Button>
              <div className="flex-grow">
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-6 w-6" />
                  Live Website Viewer
                </CardTitle>
                <CardDescription>
                  Currently viewing: <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{currentSite.name}</a>
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center">
              {!isPoppedOut && onHide && (
                <Button variant="ghost" size="icon" onClick={onHide}>
                  <EyeOff className="h-4 w-4" />
                </Button>
              )}
              {!isPoppedOut && onPopOut && <PopOutButton onClick={onPopOut} />}
            </div>
          </div>
          <div className="flex items-center gap-2 pt-4">
              <TabsList>
                  {siteKeys.map(key => (
                    <TabsTrigger key={key} value={key}>{SITES[key as keyof typeof SITES].name}</TabsTrigger>
                  ))}
              </TabsList>
              <Button variant="outline" size="icon" onClick={handleRefresh} aria-label="Refresh Iframe">
                  <RefreshCw className="h-4 w-4" />
              </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-grow p-0 overflow-hidden">
          <div className="w-full h-full rounded-b-lg overflow-hidden">
            {siteKeys.map(key => (
              <TabsContent key={key} value={key} className="h-full mt-0">
                  <iframe
                    key={`${key}-${iframeKey}`}
                    src={currentUrl}
                    className="w-full h-full border-0"
                    title={`Live view of ${SITES[key as keyof typeof SITES].name}`}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  />
              </TabsContent>
            ))}
          </div>
        </CardContent>
      </Tabs>
    </Card>
  );
}
