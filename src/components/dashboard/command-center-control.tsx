
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
import { useSidebar } from '@/context/SidebarContext';

const PROFILES_KEY_PREFIX = 'commandCenterProfile_';

export type CommandCenterSettings = {
    visibleModules: string[];
    theme: {
        background: string;
        card: string;
        primary: string;
        accent: string;
        title: string;
        foreground: string;
    };
    fontSize: number;
};

type Profile = {
    name: string;
    settings: CommandCenterSettings;
};

const defaultSettings: CommandCenterSettings = {
    visibleModules: ALL_MODULES_CONFIG.map(m => m.id),
    theme: { 
        background: '240 5% 19%', 
        card: '240 4% 12%',
        primary: '174 100% 29%', 
        accent: '262 52% 47%',
        title: '39 98% 50%',
        foreground: '210 40% 98%',
    },
    fontSize: 16,
};

interface CommandCenterControlProps {
    isPoppedOut?: boolean;
}

export function CommandCenterControl({ isPoppedOut = false }: CommandCenterControlProps) {
    const { addLog } = useLogs();
    const { toast } = useToast();
    const { setPanelOpen } = useControlPanel();
    const { hiddenModules, setHiddenModules } = useSidebar();

    // Local state for UI controls
    const [theme, setTheme] = useState(defaultSettings.theme);
    const [fontSize, setFontSize] = useState(defaultSettings.fontSize);
    
    const [selectedProfile, setSelectedProfile] = useState<string>('profile1');
    const [profileNames, setProfileNames] = useState<{[key: string]: string}>({
        profile1: "Default",
        profile2: "Profile 2",
        profile3: "Profile 3",
        profile4: "Profile 4",
    });
    
    // Function to apply styles to the document
    const applySettings = useCallback((settings: CommandCenterSettings) => {
        // Apply theme
        document.documentElement.style.setProperty('--background', settings.theme.background);
        document.documentElement.style.setProperty('--card', settings.theme.card);
        document.documentElement.style.setProperty('--primary', settings.theme.primary);
        document.documentElement.style.setProperty('--accent', settings.theme.accent);
        document.documentElement.style.setProperty('--title-foreground', settings.theme.title);
        document.documentElement.style.setProperty('--foreground', settings.theme.foreground);

        // Apply font size
        document.documentElement.style.fontSize = `${settings.fontSize}px`;

        // Update local state
        setTheme(settings.theme);
        setFontSize(settings.fontSize);

        // Update module visibility
        const modulesToHide = ALL_MODULES_CONFIG.map(m => m.id).filter(id => !settings.visibleModules.includes(id));
        setHiddenModules(modulesToHide);
    }, [setHiddenModules]);

    const handleModuleToggle = (moduleId: string) => {
        const newHidden = hiddenModules.includes(moduleId)
            ? hiddenModules.filter(id => id !== moduleId)
            : [...hiddenModules, moduleId];
        setHiddenModules(newHidden);
    };
    
    const handleThemeChange = (colorType: keyof typeof theme, value: string) => {
        const newTheme = { ...theme, [colorType]: value };
        setTheme(newTheme);
        
        let propertyName = `--${colorType}`;
        if (colorType === 'title') {
             propertyName = '--title-foreground';
        }
        document.documentElement.style.setProperty(propertyName, value);
    };

    const handleFontSizeChange = (value: number[]) => {
        const newSize = value[0];
        setFontSize(newSize);
        document.documentElement.style.fontSize = `${newSize}px`;
    };

    const handleSaveProfile = () => {
        const currentSettings: CommandCenterSettings = {
            visibleModules: ALL_MODULES_CONFIG.map(m => m.id).filter(id => !hiddenModules.includes(id)),
            theme,
            fontSize,
        };
        
        try {
            localStorage.setItem(`${PROFILES_KEY_PREFIX}${selectedProfile}`, JSON.stringify(currentSettings));
            toast({title: "Profile Saved", description: `Configuration saved to ${profileNames[selectedProfile]}.`});
            addLog({ service: 'System', level: 'info', message: `User saved settings to profile: ${profileNames[selectedProfile]}` });
        } catch (e) {
            toast({title: "Save Failed", description: "Could not save profile.", variant: "destructive"});
        }
    };

    const handleLoadProfile = (profileId: string) => {
        setSelectedProfile(profileId);
        try {
            const profileJSON = localStorage.getItem(`${PROFILES_KEY_PREFIX}${profileId}`);
            if (profileJSON) {
                const savedSettings: CommandCenterSettings = JSON.parse(profileJSON);
                applySettings(savedSettings);
                toast({title: "Profile Loaded", description: `Loaded configuration from ${profileNames[profileId]}.`});
                addLog({ service: 'System', level: 'info', message: `User loaded settings from profile: ${profileNames[profileId]}` });
            } else {
                 applySettings(defaultSettings);
                toast({title: "Profile Empty", description: `No saved settings found for ${profileNames[profileId]}. Loading defaults.`});
            }
        } catch(e) {
             toast({title: "Load Failed", description: "Could not load profile.", variant: "destructive"});
        }
    };
    
    const handleResetToDefault = () => {
        applySettings(defaultSettings);
        toast({title: "Settings Reset", description: "Control Panel settings have been reset to default."});
    }
    
    const hslToHex = (hslStr: string) => {
      if (!hslStr) return "#000000";
      const [h, s, l] = hslStr.replace(/%/g, '').split(" ").map(Number);
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
        if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length === 7) {
            r = parseInt(hex.substring(1, 3), 16);
            g = parseInt(hex.substring(3, 5), 16);
            b = parseInt(hex.substring(5, 7), 16);
        }
        r /= 255; g /= 255; b /= 255;
        let cmin = Math.min(r,g,b), cmax = Math.max(r,g,b), delta = cmax - cmin;
        let h = 0, s = 0, l = 0;
        if (delta === 0) h = 0;
        else if (cmax === r) h = ((g - b) / delta) % 6;
        else if (cmax === g) h = (b - r) / delta + 2;
        else h = (r - g) / delta + 4;
        h = Math.round(h * 60);
        if (h < 0) h += 360;
        l = (cmax + cmin) / 2;
        s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
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
                            Settings
                        </CardTitle>
                        <CardDescription>
                            Configure your local dashboard's appearance and modules.
                        </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setPanelOpen(false)}>
                        <X className="h-5 w-5"/>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col gap-4 overflow-y-auto">
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
                                Save Profile
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
                                        checked={!hiddenModules.includes(module.id)}
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
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                           <div className="space-y-1">
                                <Label htmlFor="bg-color">Main Background</Label>
                                <Input id="bg-color" type="color" value={hslToHex(theme.background)} onChange={e => handleThemeChange('background', hexToHsl(e.target.value))} />
                           </div>
                           <div className="space-y-1">
                                <Label htmlFor="card-color">Card Background</Label>
                                <Input id="card-color" type="color" value={hslToHex(theme.card)} onChange={e => handleThemeChange('card', hexToHsl(e.target.value))} />
                           </div>
                           <div className="space-y-1">
                                <Label htmlFor="pri-color">Primary</Label>
                                <Input id="pri-color" type="color" value={hslToHex(theme.primary)} onChange={e => handleThemeChange('primary', hexToHsl(e.target.value))} />
                           </div>
                           <div className="space-y-1">
                                <Label htmlFor="acc-color">Accent</Label>
                                <Input id="acc-color" type="color" value={hslToHex(theme.accent)} onChange={e => handleThemeChange('accent', hexToHsl(e.target.value))} />
                           </div>
                            <div className="space-y-1">
                                <Label htmlFor="title-color">Title</Label>
                                <Input id="title-color" type="color" value={hslToHex(theme.title)} onChange={e => handleThemeChange('title', hexToHsl(e.target.value))} />
                           </div>
                           <div className="space-y-1">
                                <Label htmlFor="fg-color">Text</Label>
                                <Input id="fg-color" type="color" value={hslToHex(theme.foreground)} onChange={e => handleThemeChange('foreground', hexToHsl(e.target.value))} />
                           </div>
                        </div>
                    </div>

                     {/* Font Size */}
                     <div className="p-3 border rounded-lg space-y-3">
                         <Label className="text-base font-semibold flex items-center gap-2"><CaseUpper className="h-5 w-5"/>Font Size ({fontSize}px)</Label>
                         <Slider 
                            value={[fontSize]}
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
