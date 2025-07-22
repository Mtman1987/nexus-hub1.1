
"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { LogViewer } from '@/components/dashboard/log-viewer';
import { ApiSettings } from '@/components/dashboard/api-settings';
import { UnifiedChat } from '@/components/dashboard/unified-chat';
import { UserRoles } from '@/components/dashboard/user-roles';
import { WebsiteViewer } from '@/components/dashboard/website-viewer';
import { FallbackStrategy } from '@/components/dashboard/fallback-strategy';
import { SavedItems } from '@/components/dashboard/saved-items';
import { LoreWeaver } from '@/components/dashboard/lore-weaver';
import { TimeZoneConverter } from '@/components/dashboard/timezone-converter';
import { BotPersonality } from '@/components/dashboard/bot-personality';
import { ImageGenerator } from '@/components/dashboard/image-generator';
import { MusicPlayer } from '@/components/dashboard/music-player';
import { ResumeParser } from '@/components/dashboard/resume-parser';
import { Translator } from '@/components/dashboard/translator';
import { CodeHelper } from '@/components/dashboard/code-helper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { LogProvider } from '@/context/LogContext';
import { BotNameProvider } from '@/context/BotNameContext';
import { SidebarProvider } from '@/context/SidebarContext';

const moduleMap: { [key: string]: React.ComponentType<any> } = {
  logViewer: LogViewer,
  apiSettings: ApiSettings,
  unifiedChat: UnifiedChat,
  userRoles: UserRoles,
  websiteViewer: WebsiteViewer,
  fallbackStrategy: FallbackStrategy,
  savedItems: SavedItems,
  loreWeaver: LoreWeaver,
  timeZoneConverter: TimeZoneConverter,
  botPersonality: BotPersonality,
  imageGenerator: ImageGenerator,
  musicPlayer: MusicPlayer,
  resumeParser: ResumeParser,
  translator: Translator,
  codeHelper: CodeHelper,
};

function PopoutContent({ slug }: { slug: string }) {
    const searchParams = useSearchParams();
    const title = searchParams.get('title') || 'Apollo Station Module';

    useEffect(() => {
        document.title = title;
    }, [title]);

    const Component = moduleMap[slug];

    if (!Component) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle>Error</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Module not found: {slug}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="h-screen w-screen bg-background text-foreground p-4">
            <LogProvider>
                <BotNameProvider>
                    <SidebarProvider>
                        <Component isPoppedOut={true} />
                    </SidebarProvider>
                </BotNameProvider>
            </LogProvider>
        </div>
    );
}

export default function PopoutPage({ params }: { params: { slug: string[] } }) {
    const slug = params.slug ? params.slug.join('/') : '';
    
    return (
        <Suspense fallback={
            <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <PopoutContent slug={slug} />
        </Suspense>
    );
}
