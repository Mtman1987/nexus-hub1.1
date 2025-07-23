
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PopOutButton } from './pop-out-button';
import { SlidersHorizontal, GripVertical, EyeOff, Monitor, Palette, CaseUpper, Save, Check, RefreshCw } from 'lucide-react';
import { useLogs } from '@/context/LogContext';
import { useToast } from '@/hooks/use-toast';
import { ALL_MODULES_CONFIG } from '@/app/dashboard/page';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    visibleModules: ALL_MODULES_CONFIG.map(m => m.id).filter(id => id !== 'commandCenterControl'),
    theme: { background: '', primary: '', accent: '' },
    fontSize: 16,
};

interface CommandCenterControlProps {
    onPopOut?: () => void;
    isPoppedOut?: boolean;
    onHide?: () => void;
    dragHandleProps?: any;
    isPreview?: boolean;
}

export function CommandCenterControl({ onPopOut, isPoppedOut = false, onHide, dragHandleProps, isPreview }: CommandCenterControlProps) {
    const { addLog } = useLogs();
    const { toast } = useToast();
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
        if (isPreview) return;
        try {
            const saved = localStorage.getItem(SETTINGS_KEY);
            if(saved) setSettings(JSON.parse(saved));

            const savedProfiles = localStorage.getItem(PROFILES_KEY);
            if(savedProfiles) setProfiles(JSON.parse(savedProfiles));

            addLog({ service: 'System', level: 'info', message: 'Command Center Control initialized.' });
        } catch(e) {
            console.error("Failed to load command center settings", e);
        }
    }, [isPreview, addLog]);

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

    const modulesToShow = ALL_MODULES_CONFIG.filter(m => m.id !== 'commandCenterControl');

    return (
        <Card className="flex flex-col bg-card/80">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 flex-grow">
                        <Button variant="ghost" size="icon" {...dragHandleProps} className="cursor-grab p-1 h-auto w-auto">
                            <GripVertical />
                        </Button>
                        <div className="flex-grow">
                            <CardTitle className="flex items-center gap-2 text-title-foreground">
                                <SlidersHorizontal className="h-6 w-6" />
                                Command Center Control
                            </CardTitle>
                            <CardDescription>
                                Remotely configure your separate dashboard window.
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <Button asChild variant="outline" size="sm" className="mr-2">
                           <a href="/dashboard" target="_blank" rel="noopener noreferrer">
                             <Monitor className="mr-2 h-4 w-4"/>
                             Open Command Center
                           </a>
                        </Button>
                        {!isPoppedOut && onHide && ( <Button variant="ghost" size="icon" onClick={onHide}> <EyeOff className="h-4 w-4" /> </Button>)}
                        {!isPoppedOut && onPopOut && <PopOutButton onClick={onPopOut} />}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col gap-4">
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
                         <Label className="text-base font-semibold flex items-center gap-2"><EyeOff className="h-5 w-5"/>Visible Modules</Label>
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
                                <Input id="bg-color" type="color" value={settings.theme.background} onChange={e => handleThemeChange('background', e.target.value)} />
                           </div>
                           <div className="space-y-1">
                                <Label htmlFor="pri-color">Primary</Label>
                                <Input id="pri-color" type="color" value={settings.theme.primary} onChange={e => handleThemeChange('primary', e.target.value)} />
                           </div>
                           <div className="space-y-1">
                                <Label htmlFor="acc-color">Accent</Label>
                                <Input id="acc-color" type="color" value={settings.theme.accent} onChange={e => handleThemeChange('accent', e.target.value)} />
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

