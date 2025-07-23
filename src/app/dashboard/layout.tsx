
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
                if(parsedSettings.theme.background) root.style.setProperty('--background', parsedSettings.theme.background);
                if(parsedSettings.theme.primary) root.style.setProperty('--primary', parsedSettings.theme.primary);
                if(parsedSettings.theme.accent) root.style.setProperty('--accent', parsedSettings.theme.accent);
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
            root.style.removeProperty('--background');
            root.style.removeProperty('--primary');
            root.style.removeProperty('--accent');
            root.style.removeProperty('font-size');
        };
    }, []);

    const style: React.CSSProperties = settings ? {
        '--background': settings.theme.background ? `hsl(${settings.theme.background})` : undefined,
        '--primary': settings.theme.primary ? `hsl(${settings.theme.primary})` : undefined,
        '--accent': settings.theme.accent ? `hsl(${settings.theme.accent})` : undefined,
    } as React.CSSProperties : {};


  return (
    <div className="bg-theme" style={style}>
        <div className="planet"></div>
        <div className="shooting-star" style={{ top: '10vh', left: '40vw', animationDelay: '-1s' }}></div>
        <div className="shooting-star" style={{ top: '50vh', left: '60vw', animationDelay: '-3.4s' }}></div>
        <div className="shooting-star" style={{ top: '80vh', left: '90vw', animationDelay: '-5.8s' }}></div>
        <div className="shooting-star-reverse" style={{ top: '20vh', left: '10vw', animationDelay: '-2.2s' }}></div>
        <div className="shooting-star-reverse" style={{ top: '60vh', left: '80vw', animationDelay: '-4.1s' }}></div>
        <div className="shooting-star-reverse" style={{ top: '90vh', left: '30vw', animationDelay: '-0.5s' }}></div>
        {children}
    </div>
  );
}
