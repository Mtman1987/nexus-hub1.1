
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Monitor, Palette, CaseUpper, Save, RefreshCw, SlidersHorizontal, X } from 'lucide-react';
import { useLogs } from '@/context/LogContext';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ALL_MODULES_CONFIG } from '@/lib/modules';
import { useControlPanel } from '@/context/ControlPanelContext';

const SETTINGS_KEY = 'commandCenterSettings';
const PROFILES_KEY = 'commandCenterProfiles';

export type CommandCenterSettings = {
    visibleModules: string[];
    theme: {
        background: string;
        primary: string;
        accent: string;
    };
    fontSize: number;
};

type Profile = {
    name: string;
    settings: CommandCenterSettings;
};

const defaultSettings: CommandCenterSettings = {
    visibleModules: ALL_MODULES_CONFIG.map(m => m.id),
    theme: { background: '262 52% 10%', primary: '174 100% 34%', accent: '174 100% 34%' },
    fontSize: 16,
};

interface CommandCenterControlProps {
    isPoppedOut?: boolean;
}

export function CommandCenterControl({ isPoppedOut = false }: CommandCenterControlProps) {
    const { addLog } = useLogs();
    const { toast } = useToast();
    const { setPanelOpen } = useControlPanel();
    const [settings, setSettings] = useState<CommandCenterSettings>(defaultSettings);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [selectedProfile, setSelectedProfile] = useState<string>('profile1');
    const [profileNames, setProfileNames] = useState<{[key: string]: string}>({
        profile1: "Default",
        profile2: "Profile 2",
        profile3: "Profile 3",
        profile4: "Profile 4",
    });

    const broadcastSettings = useCallback((newSettings: CommandCenterSettings) => {
        try {
            const channel = new BroadcastChannel('command-center-settings');
            channel.postMessage(newSettings);
            channel.close();
        } catch (e) {
            console.error("BroadcastChannel failed", e);
        }
    }, []);

    const saveSettings = useCallback((newSettings: CommandCenterSettings) => {
        setSettings(newSettings);
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
        broadcastSettings(newSettings);
        addLog({ service: 'System', level: 'info', message: 'Command Center settings updated.' });
    }, [addLog, broadcastSettings]);
    
    useEffect(() => {
        try {
            const saved = localStorage.getItem(SETTINGS_KEY);
            if(saved) setSettings(JSON.parse(saved));

            const savedProfiles = localStorage.getItem(PROFILES_KEY);
            if(savedProfiles) setProfiles(JSON.parse(savedProfiles));

            addLog({ service: 'System', level: 'info', message: 'Command Center Control initialized.' });
        } catch(e) {
            console.error("Failed to load command center settings", e);
        }
    }, [addLog]);

    const handleModuleToggle = (moduleId: string) => {
        const newVisible = settings.visibleModules.includes(moduleId)
            ? settings.visibleModules.filter(id => id !== moduleId)
            : [...settings.visibleModules, moduleId];
        saveSettings({ ...settings, visibleModules: newVisible });
    };
    
    const handleThemeChange = (colorType: 'background' | 'primary' | 'accent', value: string) => {
        saveSettings({ ...settings, theme: { ...settings.theme, [colorType]: value } });
    };

    const handleFontSizeChange = (value: number[]) => {
        saveSettings({ ...settings, fontSize: value[0] });
    };

    const handleSaveProfile = () => {
        const newProfiles = [...profiles];
        const existingIndex = newProfiles.findIndex(p => p.name === selectedProfile);
        const profileData = { name: selectedProfile, settings: settings };
        if(existingIndex > -1) {
            newProfiles[existingIndex] = profileData;
        } else {
            newProfiles.push(profileData);
        }
        setProfiles(newProfiles);
        localStorage.setItem(PROFILES_KEY, JSON.stringify(newProfiles));
        toast({title: "Profile Saved", description: `Configuration saved to ${profileNames[selectedProfile]}.`})
    };

    const handleLoadProfile = (profileId: string) => {
        setSelectedProfile(profileId);
        const profile = profiles.find(p => p.name === profileId);
        if(profile) {
            saveSettings(profile.settings);
            toast({title: "Profile Loaded", description: `Loaded configuration from ${profileNames[profileId]}.`})
        } else {
            toast({title: "Profile Empty", description: `No saved settings found for ${profileNames[profileId]}.`, variant: "destructive"})
        }
    };
    
    const handleResetToDefault = () => {
        saveSettings(defaultSettings);
        toast({title: "Settings Reset", description: "Command Center settings have been reset to default."});
    }
    
    const parseHslString = (hsl: string): string => {
        if (!hsl) return '#000000';
        const [h, s, l] = hsl.split(' ');
        return `hsl(${h} ${s} ${l})`;
    };
    
    const hslToHex = (hslStr: string) => {
      if (!hslStr) return "#000000";
      const [h, s, l] = hslStr.split(" ").map(Number);
      const sNormalized = s / 100;
      const lNormalized = l / 100;
      let c = (1 - Math.abs(2 * lNormalized - 1)) * sNormalized;
      let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
      let m = lNormalized - c / 2;
      let r = 0, g = 0, b = 0;
      if (0 <= h && h < 60) {
        r = c; g = x; b = 0;
      } else if (60 <= h && h < 120) {
        r = x; g = c; b = 0;
      } else if (120 <= h && h < 180) {
        r = 0; g = c; b = x;
      } else if (180 <= h && h < 240) {
        r = 0; g = x; b = c;
      } else if (240 <= h && h < 300) {
        r = x; g = 0; b = c;
      } else if (300 <= h && h < 360) {
        r = c; g = 0; b = x;
      }
      r = Math.round((r + m) * 255);
      g = Math.round((g + m) * 255);
      b = Math.round((b + m) * 255);
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    };

    const hexToHsl = (hex: string): string => {
        let r = 0, g = 0, b = 0;
        if (hex.length == 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length == 7) {
            r = parseInt(hex.substring(1, 3), 16);
            g = parseInt(hex.substring(3, 5), 16);
            b = parseInt(hex.substring(5, 7), 16);
        }
        r /= 255; g /= 255; b /= 255;
        let cmin = Math.min(r,g,b), cmax = Math.max(r,g,b), delta = cmax - cmin;
        let h = 0, s = 0, l = 0;
        if (delta == 0) h = 0;
        else if (cmax == r) h = ((g - b) / delta) % 6;
        else if (cmax == g) h = (b - r) / delta + 2;
        else h = (r - g) / delta + 4;
        h = Math.round(h * 60);
        if (h < 0) h += 360;
        l = (cmax + cmin) / 2;
        s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
        s = +(s * 100).toFixed(1);
        l = +(l * 100).toFixed(1);
        return `${h} ${s}% ${l}%`;
    }

    const modulesToShow = ALL_MODULES_CONFIG;

    return (
        <Card className="flex flex-col bg-card/80 h-full border-0 rounded-none">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex-grow">
                        <CardTitle className="flex items-center gap-2 text-title-foreground">
                            <SlidersHorizontal className="h-6 w-6" />
                            Control Panel
                        </CardTitle>
                        <CardDescription>
                            Remotely configure your separate dashboard window.
                        </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setPanelOpen(false)}>
                        <X className="h-5 w-5"/>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col gap-4 overflow-y-auto">
                 <Button asChild variant="outline" size="sm" className="w-full">
                   <a href="/dashboard" target="_blank" rel="noopener noreferrer">
                     <Monitor className="mr-2 h-4 w-4"/>
                     Open Command Center
                   </a>
                </Button>
                <div className="space-y-4">
                     {/* Profile Management */}
                     <div className="p-3 border rounded-lg space-y-3">
                        <Label className="text-base font-semibold">Configuration Profiles</Label>
                        <div className="flex items-center gap-2">
                            <Select value={selectedProfile} onValueChange={handleLoadProfile}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="profile1">{profileNames.profile1}</SelectItem>
                                    <SelectItem value="profile2">{profileNames.profile2}</SelectItem>
                                    <SelectItem value="profile3">{profileNames.profile3}</SelectItem>
                                    <SelectItem value="profile4">{profileNames.profile4}</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={handleSaveProfile} variant="outline" size="sm">
                                <Save className="mr-2 h-4 w-4"/>
                                Save Current
                            </Button>
                        </div>
                    </div>
                    {/* Module Visibility */}
                    <div className="p-3 border rounded-lg space-y-2">
                         <Label className="text-base font-semibold flex items-center gap-2">Visible Modules</Label>
                        <ScrollArea className="h-32">
                           <div className="grid grid-cols-2 gap-2 pr-4">
                            {modulesToShow.map(module => (
                                <div key={module.id} className="flex items-center gap-2">
                                    <Checkbox 
                                        id={`vis-${module.id}`}
                                        checked={settings.visibleModules.includes(module.id)}
                                        onCheckedChange={() => handleModuleToggle(module.id)}
                                    />
                                    <Label htmlFor={`vis-${module.id}`} className="text-sm font-normal cursor-pointer">{module.title}</Label>
                                </div>
                            ))}
                           </div>
                        </ScrollArea>
                    </div>

                    {/* Theming */}
                    <div className="p-3 border rounded-lg space-y-3">
                        <Label className="text-base font-semibold flex items-center gap-2"><Palette className="h-5 w-5"/>Theme</Label>
                        <div className="grid grid-cols-3 gap-2">
                           <div className="space-y-1">
                                <Label htmlFor="bg-color">Background</Label>
                                <Input id="bg-color" type="color" value={hslToHex(settings.theme.background)} onChange={e => handleThemeChange('background', hexToHsl(e.target.value))} />
                           </div>
                           <div className="space-y-1">
                                <Label htmlFor="pri-color">Primary</Label>
                                <Input id="pri-color" type="color" value={hslToHex(settings.theme.primary)} onChange={e => handleThemeChange('primary', hexToHsl(e.target.value))} />
                           </div>
                           <div className="space-y-1">
                                <Label htmlFor="acc-color">Accent</Label>
                                <Input id="acc-color" type="color" value={hslToHex(settings.theme.accent)} onChange={e => handleThemeChange('accent', hexToHsl(e.target.value))} />
                           </div>
                        </div>
                    </div>

                     {/* Font Size */}
                     <div className="p-3 border rounded-lg space-y-3">
                         <Label className="text-base font-semibold flex items-center gap-2"><CaseUpper className="h-5 w-5"/>Font Size ({settings.fontSize}px)</Label>
                         <Slider 
                            value={[settings.fontSize]}
                            min={12}
                            max={24}
                            step={1}
                            onValueChange={handleFontSizeChange}
                         />
                     </div>
                </div>
                 <div className="mt-auto flex justify-end pt-4 border-t">
                    <Button onClick={handleResetToDefault} variant="destructive">
                       <RefreshCw className="mr-2 h-4 w-4"/>
                       Reset to Default
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
