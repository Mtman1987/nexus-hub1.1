
"use client";
import * as React from 'react';
import type { CommandCenterSettings } from '@/components/dashboard/command-center-control';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
    const [settings, setSettings] = React.useState<CommandCenterSettings | null>(null);

    React.useEffect(() => {
        const applySettings = () => {
            const savedSettings = localStorage.getItem('commandCenterSettings');
            if (savedSettings) {
                const parsedSettings: CommandCenterSettings = JSON.parse(savedSettings);
                setSettings(parsedSettings);

                const root = document.documentElement;
                if(parsedSettings.theme.background) root.style.setProperty('--background-override', parsedSettings.theme.background);
                if(parsedSettings.theme.primary) root.style.setProperty('--primary-override', parsedSettings.theme.primary);
                if(parsedSettings.theme.accent) root.style.setProperty('--accent-override', parsedSettings.theme.accent);
                if(parsedSettings.fontSize) root.style.fontSize = `${parsedSettings.fontSize}px`;

            }
        };

        applySettings();

        const channel = new BroadcastChannel('command-center-settings');
        channel.onmessage = applySettings;
        
        return () => {
            channel.close();
            // Reset styles on unmount
            const root = document.documentElement;
            root.style.removeProperty('--background-override');
            root.style.removeProperty('--primary-override');
            root.style.removeProperty('--accent-override');
            root.style.removeProperty('font-size');
        };
    }, []);

    const style: React.CSSProperties = settings ? {
        '--background': settings.theme.background ? `var(--background-override)` : undefined,
        '--primary': settings.theme.primary ? `var(--primary-override)` : undefined,
        '--accent': settings.theme.accent ? `var(--accent-override)` : undefined,
    } as React.CSSProperties : {};


  return <div style={style}>{children}</div>;
}

