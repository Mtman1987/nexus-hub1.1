
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Save, LifeBuoy, Power, Bot, PlusCircle, Trash2, Link, Copy, Server, KeyRound, RefreshCw, Radio } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { SetupDialog } from './setup-dialog';
import { useToast } from '@/hooks/use-toast';
import { useLogs } from '@/context/LogContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useBotName } from '@/context/BotNameContext';
import { Textarea } from '../ui/textarea';
import { PopOutButton } from './pop-out-button';

export const settingKeys = [
  'botPersonalities', 'selectedPersonalityId', 'edenApiKey', 'edenAiModelName', 'googleApiKey', 'googleModelName',
  'openaiApiKey', 'openaiModelName', 'groqApiKey', 'groqModelName',
  'discordToken', 'discordWebhook', 'twitchToken', 'providerStatus',
  'streamerbotServerAddress', 'streamerbotServerPort', 'streamerbotRequestType', 'streamerbotActionName', 'streamerbotVariableName', 'streamerbotWebhookUrl',
  'nexusConnectWebhookUrl', 'nexusConnectConnections', 'remoteHubAddress', 'remoteAccessSecret'
] as const;

export type SettingKey = typeof settingKeys[number];

type SettingsObjectKey = Exclude<SettingKey, 'providerStatus' | 'botPersonalities' | 'selectedPersonalityId' | 'nexusConnectConnections'>;

export type Settings = {
    [key in SettingsObjectKey]?: string;
} & {
    nexusConnectConnections?: string[];
};

export type AiProviderId = 'google' | 'openai' | 'groq';
export type ServiceProviderId = 'discord' | 'twitch' | 'streamerbot' | 'nexusconnect';
export type ProviderId = AiProviderId | ServiceProviderId;

type ProviderStatus = {
    [key in ProviderId]: 'enabled' | 'disabled';
}

export type BotPersonality = {
  id: string;
  name: string;
  prompt: string;
}

const modelOptions = {
    eden: [
        { value: "openai/gpt-4-turbo", label: "openai/gpt-4-turbo" },
        { value: "openai/gpt-4o", label: "openai/gpt-4o" },
        { value: "google/gemini-1.5-pro-latest", label: "google/gemini-1.5-pro-latest" },
        { value: "anthropic/claude-3-haiku-20240307", label: "anthropic/claude-3-haiku" },
        { value: "cohere/command-r-plus", label: "cohere/command-r-plus" },
        { value: "meta/llama-3-70b-instruct", label: "meta/llama-3-70b-instruct" },
    ],
    google: [
        { value: "gemini-1.5-flash-latest", label: "gemini-1.5-flash-latest (Default)" },
        { value: "gemini-1.5-pro-latest", label: "gemini-1.5-pro-latest" },
        { value: "gemini-1.0-pro", label: "gemini-1.0-pro" },
    ],
    openai: [
        { value: "gpt-4-turbo", label: "gpt-4-turbo (Default)" },
        { value: "gpt-4o", label: "gpt-4o" },
        { value: "gpt-3.5-turbo", label: "gpt-3.5-turbo" },
    ],
    groq: [
        { value: "llama3-8b-8192", label: "llama3-8b-8192 (Default)" },
        { value: "llama3-70b-8192", label: "llama3-70b-8192" },
        { value: "mixtral-8x7b-32768", label: "mixtral-8x7b-32768" },
    ]
}

const defaultModels: { [key in 'edenAiModelName' | 'googleModelName' | 'openaiModelName' | 'groqModelName']: string } = {
    edenAiModelName: 'openai/gpt-4-turbo',
    googleModelName: 'gemini-1.5-flash-latest',
    openaiModelName: 'gpt-4-turbo',
    groqModelName: 'llama3-8b-8192',
};

const defaultProviderStatus: ProviderStatus = {
    google: 'enabled',
    openai: 'enabled',
    groq: 'enabled',
    discord: 'enabled',
    twitch: 'enabled',
    streamerbot: 'disabled',
    nexusconnect: 'enabled',
};

const defaultSettings: Partial<Settings> = {
  streamerbotServerAddress: '127.0.0.1',
  streamerbotServerPort: '9003',
  streamerbotRequestType: 'DoAction',
  streamerbotActionName: 'Nexus Hub Message',
  streamerbotVariableName: 'nexusHubMessage',
  streamerbotWebhookUrl: typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}/api/streamerbot-relay` : '',
  nexusConnectWebhookUrl: typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}/api/nexus-connect` : '',
  nexusConnectConnections: [],
  remoteHubAddress: '',
  remoteAccessSecret: '',
}

const FALLBACK_ORDER: AiProviderId[] = ['google', 'openai', 'groq'];

const CustomAccordionTrigger: React.FC<React.PropsWithChildren<{icon: React.ReactNode, title: string}>> = ({ children, icon, title }) => (
    <AccordionTrigger className="text-lg font-semibold hover:no-underline">
        <div className="flex items-center gap-2">
            {icon}
            {title}
        </div>
    </AccordionTrigger>
);

const ServiceStatusToggle: React.FC<{
  providerId: ProviderId;
  isConfigured: boolean;
  providerStatus: ProviderStatus;
  onStatusChange: (providerId: ProviderId, enabled: boolean) => void;
}> = ({ providerId, isConfigured, providerStatus, onStatusChange }) => {
  const isEnabled = providerStatus[providerId] === 'enabled';
  const lightColor = !isConfigured ? 'bg-status-neutral' : isEnabled ? 'bg-status-positive' : 'bg-destructive';

  return (
    <div className="space-y-2">
      <Label htmlFor={`${providerId}-status`} className="flex items-center gap-2">
        <Power className="h-4 w-4" />
        Service Status
      </Label>
      <div className="flex items-center gap-3">
        <Switch
          id={`${providerId}-status`}
          checked={isEnabled}
          onCheckedChange={(checked) => onStatusChange(providerId, checked)}
          disabled={!isConfigured}
        />
        <div className="flex items-center gap-2">
          <div className={cn("h-3 w-3 rounded-full", lightColor)}></div>
          <span className="text-sm text-muted-foreground">
            {!isConfigured ? 'Not Configured' : isEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>
    </div>
  );
};


interface ApiSettingsProps {
    isPoppedOut?: boolean;
    onPopOut?: () => void;
    botName?: string;
    setBotName?: (name: string) => void;
}

export function ApiSettings({ isPoppedOut = false, onPopOut, setBotName: setContextBotName }: ApiSettingsProps) {
  const [showSetup, setShowSetup] = useState(false);
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [providerStatus, setProviderStatus] = useState<ProviderStatus>(defaultProviderStatus);
  const { addLog } = useLogs();
  const [openAccordions, setOpenAccordions] = useState<string[]>(['bot-personality', 'eden', 'discord']);
  
  const { botName, setBotName: contextSetBotName } = useBotName();
  const setBotName = setContextBotName || contextSetBotName;

  const [personalities, setPersonalities] = useState<BotPersonality[]>([]);
  const [selectedPersonalityId, setSelectedPersonalityId] = useState<string | null>(null);

  useEffect(() => {
    try {
        const loadedSettings: Partial<Settings> = {};
        const keysToLoad: SettingsObjectKey[] = settingKeys.filter((k): k is SettingsObjectKey => !['providerStatus', 'botPersonalities', 'selectedPersonalityId', 'nexusConnectConnections'].includes(k));

        for (const key of keysToLoad) {
            const value = localStorage.getItem(key);
            if (value !== null) {
                loadedSettings[key as SettingsObjectKey] = value;
            }
        }
        
        let savedConnections = localStorage.getItem('nexusConnectConnections');
        if (!savedConnections && typeof window !== 'undefined') {
            const selfUrl = `${window.location.protocol}//${window.location.host}/api/nexus-connect`;
            savedConnections = JSON.stringify([selfUrl]); 
            localStorage.setItem('nexusConnectConnections', savedConnections); 
        }

        if (savedConnections) {
            loadedSettings.nexusConnectConnections = JSON.parse(savedConnections);
        }
        
        const savedStatus = localStorage.getItem('providerStatus');
        if (savedStatus) {
            try {
                setProviderStatus({ ...defaultProviderStatus, ...JSON.parse(savedStatus) });
            } catch (e) {
                 console.error("Failed to parse providerStatus from localStorage", e);
                 setProviderStatus(defaultProviderStatus);
            }
        } else {
          setProviderStatus(defaultProviderStatus);
        }
        
        const savedOpenAccordions = localStorage.getItem('apiSettingsOpen');
        if (savedOpenAccordions) {
            setOpenAccordions(JSON.parse(savedOpenAccordions));
        }

        const finalSettings = { ...defaultSettings, ...loadedSettings };
        if (!finalSettings.streamerbotWebhookUrl) {
            finalSettings.streamerbotWebhookUrl = `${window.location.protocol}//${window.location.host}/api/streamerbot-relay`;
        }
        if (!finalSettings.nexusConnectWebhookUrl) {
          finalSettings.nexusConnectWebhookUrl = `${window.location.protocol}//${window.location.host}/api/nexus-connect`;
        }
        setSettings(finalSettings);

        const savedPersonalities = localStorage.getItem('botPersonalities');
        const loadedPersonalities = savedPersonalities ? JSON.parse(savedPersonalities) : [{id: 'default-1', name: 'NexusBot', prompt: ''}];
        setPersonalities(loadedPersonalities);

        const savedSelectedId = localStorage.getItem('selectedPersonalityId');
        const selectedId = savedSelectedId && loadedPersonalities.some((p: BotPersonality) => p.id === savedSelectedId) ? savedSelectedId : loadedPersonalities[0].id;
        setSelectedPersonalityId(selectedId);
        
        const selectedPersonality = loadedPersonalities.find((p: BotPersonality) => p.id === selectedId);
        if (selectedPersonality && setBotName) {
            setBotName(selectedPersonality.name);
        }

        addLog({ service: 'System', level: 'info', message: 'API Key Vault settings loaded from local storage.' });
    } catch (error) {
        console.error("Failed to load settings from local storage", error);
        addLog({ service: 'System', level: 'error', message: 'Failed to load settings from local storage.', details: error instanceof Error ? error.stack : String(error) });
    }
  }, [setBotName, addLog]);

  const handleInputChange = (key: keyof typeof settings, value: string | string[]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };
  
  const handlePersonalityChange = (field: 'name' | 'prompt', value: string) => {
    if (!selectedPersonalityId) return;
    const newPersonalities = personalities.map(p => {
        if (p.id === selectedPersonalityId) {
            return {...p, [field]: value};
        }
        return p;
    });
    setPersonalities(newPersonalities);
    if (field === 'name' && setBotName) {
        const selectedPersonality = newPersonalities.find(p => p.id === selectedPersonalityId);
        if (selectedPersonality) {
            setBotName(selectedPersonality.name);
        }
    }
  };

  const handleSelectPersonality = (id: string) => {
    setSelectedPersonalityId(id);
    const selectedPersonality = personalities.find(p => p.id === id);
    if (selectedPersonality && setBotName) {
        setBotName(selectedPersonality.name);
    }
  };
  
  const handleAddNewPersonality = () => {
    const newId = `personality-${Date.now()}`;
    const newPersonality: BotPersonality = { id: newId, name: 'New Bot', prompt: ''};
    const newPersonalities = [...personalities, newPersonality];
    setPersonalities(newPersonalities);
    setSelectedPersonalityId(newId);
    if (setBotName) {
        setBotName(newPersonality.name);
    }
  };
  
  const handleDeletePersonality = () => {
    if (personalities.length <= 1 || !selectedPersonalityId) {
        toast({title: "Cannot Delete", description: "You must have at least one personality.", variant: "destructive"});
        return;
    }
    const newPersonalities = personalities.filter(p => p.id !== selectedPersonalityId);
    setPersonalities(newPersonalities);
    setSelectedPersonalityId(newPersonalities[0].id);
    if (setBotName) {
      setBotName(newPersonalities[0].name);
    }
  };

  const handleModelChange = (key: keyof Settings, value: string | undefined) => {
    handleInputChange(key as SettingsObjectKey, value || '');
  };

  const handleStatusChange = (providerId: ProviderId, enabled: boolean) => {
    setProviderStatus(prev => ({ ...prev, [providerId]: enabled ? 'enabled' : 'disabled' }));
  };
  
  const handleAccordionChange = (value: string[]) => {
    setOpenAccordions(value);
  };

  const handleAddConnection = () => {
    const currentConnections = settings.nexusConnectConnections || [];
    handleInputChange('nexusConnectConnections', [...currentConnections, '']);
  };

  const handleConnectionChange = (index: number, value: string) => {
    const currentConnections = [...(settings.nexusConnectConnections || [])];
    currentConnections[index] = value;
    handleInputChange('nexusConnectConnections', currentConnections);
  };
  
  const handleRemoveConnection = (index: number) => {
      const currentConnections = [...(settings.nexusConnectConnections || [])];
      currentConnections.splice(index, 1);
      handleInputChange('nexusConnectConnections', currentConnections);
  };

  const generateSecretKey = () => {
    const array = new Uint32Array(8);
    window.crypto.getRandomValues(array);
    const secret = Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
    handleInputChange('remoteAccessSecret', `nh_sec_${secret}`);
    toast({ title: "Secret Key Generated", description: "A new secret key has been generated and placed in the field." });
  };
  
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const settingsToSave: Partial<Settings> = { ...settings };
      const modelKeys = Object.keys(defaultModels) as Array<keyof typeof defaultModels>;
      for (const key of modelKeys) {
          if (!settingsToSave[key as keyof Settings]) {
              settingsToSave[key as keyof Settings] = defaultModels[key];
          }
      }

      Object.entries(settingsToSave).forEach(([key, value]) => {
          if (key === 'nexusConnectConnections') {
            localStorage.setItem('nexusConnectConnections', JSON.stringify(value || []));
          } else if (value) {
            localStorage.setItem(key, value as string);
          } else {
            localStorage.removeItem(key);
          }
      });
      
      localStorage.setItem('botPersonalities', JSON.stringify(personalities));
      if(selectedPersonalityId) {
          localStorage.setItem('selectedPersonalityId', selectedPersonalityId);
      }
      
      localStorage.setItem('providerStatus', JSON.stringify(providerStatus));
      localStorage.setItem('fallbackStrategy', JSON.stringify(FALLBACK_ORDER));
      localStorage.setItem('apiSettingsOpen', JSON.stringify(openAccordions));
      
      const currentPersonality = personalities.find(p => p.id === selectedPersonalityId);
      if (currentPersonality) {
        localStorage.setItem('botPersonalityPrompt', currentPersonality.prompt);
        localStorage.setItem('botName', currentPersonality.name);
      }

      toast({
        title: "Configuration Saved",
        description: "Your API keys and settings have been saved locally.",
      });
      addLog({ service: 'System', level: 'info', message: 'API Key Vault configuration saved by user.' });
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error("Failed to save settings to local storage", error);
      toast({
        title: "Save Failed",
        description: "Could not save settings. Your browser might be blocking local storage.",
        variant: "destructive",
      });
      addLog({ service: 'System', level: 'error', message: 'Failed to save configuration to local storage.', details: error instanceof Error ? error.stack : String(error) });
    }
  };
  
  const selectedPersonality = personalities.find(p => p.id === selectedPersonalityId);
  const copyToClipboard = (text: string) => {
    if(!text) return;
    navigator.clipboard.writeText(text).then(() => {
        toast({ title: "Copied to Clipboard", description: "Webhook URL has been copied." });
    }, (err) => {
        toast({ title: "Copy Failed", description: "Could not copy the URL.", variant: "destructive" });
    });
  };

  return (
    <>
      <SetupDialog open={showSetup} onOpenChange={setShowSetup} />
      <Card className="h-full flex flex-col relative">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-grow">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <ShieldCheck className="h-6 w-6 text-accent" />
                API Key Vault
              </CardTitle>
              <CardDescription>Manage all your secret keys and connection endpoints here.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
               {!isPoppedOut && onPopOut && <PopOutButton onClick={onPopOut} />}
              <Button variant="outline" onClick={() => setShowSetup(true)}>
                <LifeBuoy className="mr-2 h-4 w-4" />
                Setup Wizard
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <form className="space-y-4" onSubmit={handleSaveChanges}>
                <div className="space-y-2">
                    <Label>Chat Bot Personality</Label>
                    <div className="flex items-center gap-2">
                         <Select value={selectedPersonalityId || ''} onValueChange={handleSelectPersonality}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a personality..."/>
                            </SelectTrigger>
                            <SelectContent>
                                {personalities.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" size="icon" onClick={handleAddNewPersonality}><PlusCircle className="h-4 w-4"/></Button>
                        <Button type="button" variant="destructive" size="icon" onClick={handleDeletePersonality} disabled={personalities.length <= 1}><Trash2 className="h-4 w-4"/></Button>
                    </div>
                </div>


                <Accordion type="multiple" value={openAccordions} onValueChange={handleAccordionChange} className="w-full space-y-2">
                    
                    <AccordionItem value="bot-personality">
                        <CustomAccordionTrigger icon={<Bot className="h-5 w-5"/>} title="Bot Personality" />
                        <AccordionContent className="space-y-4 pt-4">
                             <div className="space-y-2">
                                <Label htmlFor="bot-name">Bot Name</Label>
                                <Input 
                                    id="bot-name" 
                                    type="text" 
                                    placeholder="e.g., NexusBot" 
                                    value={selectedPersonality?.name || ''} 
                                    onChange={(e) => handlePersonalityChange('name', e.target.value)} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bot-prompt">System Prompt</Label>
                                <Textarea 
                                    id="bot-prompt" 
                                    placeholder="You are a helpful assistant." 
                                    value={selectedPersonality?.prompt || ''} 
                                    onChange={(e) => handlePersonalityChange('prompt', e.target.value)} 
                                    rows={5}
                                />
                                <p className="text-xs text-muted-foreground">If this is empty, it will default to "You are a helpful assistant."</p>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="remote-settings">
                      <CustomAccordionTrigger icon={<Server className="h-5 w-5"/>} title="Remote Access" />
                       <AccordionContent className="space-y-4 pt-4">
                           <div className="space-y-2">
                               <Label htmlFor="remote-hub-address">Remote Hub Address</Label>
                               <Input 
                                   id="remote-hub-address" 
                                   type="text" 
                                   placeholder="e.g., https://your-tunnel.ngrok.io" 
                                   value={settings.remoteHubAddress || ''} 
                                   onChange={(e) => handleInputChange('remoteHubAddress', e.target.value)} 
                               />
                               <p className="text-xs text-muted-foreground">Enter your public tunneling URL (like ngrok) to control your local hub from this deployed UI.</p>
                           </div>
                           <div className="space-y-2">
                                <Label htmlFor="remote-access-secret">Remote Access Secret Key</Label>
                                <div className="flex items-center gap-2">
                                    <Input 
                                       id="remote-access-secret" 
                                       type="password" 
                                       placeholder="A strong, unique password for security" 
                                       value={settings.remoteAccessSecret || ''} 
                                       onChange={(e) => handleInputChange('remoteAccessSecret', e.target.value)} 
                                    />
                                    <Button type="button" variant="outline" size="icon" onClick={generateSecretKey} aria-label="Generate new secret key">
                                        <RefreshCw className="h-4 w-4"/>
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    This key must be identical on both your local hub and your cloud-hosted UI for the connection to work.
                                </p>
                           </div>
                       </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="eden">
                        <CustomAccordionTrigger icon={<Bot className="h-5 w-5 text-cyan-400"/>} title="Eden AI (Primary)" />
                        <AccordionContent className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="eden-key">Eden AI API Key</Label>
                                <Input id="eden-key" type="password" placeholder="Your primary key from Eden AI" value={settings.edenApiKey || ''} onChange={(e) => handleInputChange('edenApiKey', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="eden-model-name">Eden AI Model (provider/model_name)</Label>
                                <Select value={settings.edenAiModelName || ''} onValueChange={(value) => handleModelChange('edenAiModelName', value)}>
                                    <SelectTrigger><SelectValue placeholder="Select a model..." /></SelectTrigger>
                                    <SelectContent>
                                        {modelOptions.eden.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="google">
                        <CustomAccordionTrigger icon={<Bot className="h-5 w-5"/>} title="Google AI (Fallback)" />
                        <AccordionContent className="space-y-4 pt-4">
                            <ServiceStatusToggle providerId="google" isConfigured={!!settings.googleApiKey} providerStatus={providerStatus} onStatusChange={handleStatusChange} />
                            <div className="space-y-2">
                                <Label htmlFor="google-ai-key">Google AI API Key</Label>
                                <Input id="google-ai-key" type="password" placeholder="Your Google AI API Key" value={settings.googleApiKey || ''} onChange={(e) => handleInputChange('googleApiKey', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="google-model-name">Google AI Model</Label>
                                <Select value={settings.googleModelName || defaultModels.googleModelName} onValueChange={(value) => handleModelChange('googleModelName', value)}>
                                    <SelectTrigger><SelectValue placeholder="Select a model..." /></SelectTrigger>
                                    <SelectContent>
                                        {modelOptions.google.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="openai">
                        <CustomAccordionTrigger icon={<Bot className="h-5 w-5"/>} title="OpenAI (Fallback)" />
                        <AccordionContent className="space-y-4 pt-4">
                             <ServiceStatusToggle providerId="openai" isConfigured={!!settings.openaiApiKey} providerStatus={providerStatus} onStatusChange={handleStatusChange} />
                            <div className="space-y-2">
                                <Label htmlFor="openai-key">OpenAI API Key</Label>
                                <Input id="openai-key" type="password" placeholder="Your OpenAI API Key" value={settings.openaiApiKey || ''} onChange={(e) => handleInputChange('openaiApiKey', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="openai-model-name">OpenAI Model</Label>
                                 <Select value={settings.openaiModelName || defaultModels.openaiModelName} onValueChange={(value) => handleModelChange('openaiModelName', value)}>
                                    <SelectTrigger><SelectValue placeholder="Select a model..." /></SelectTrigger>
                                    <SelectContent>
                                        {modelOptions.openai.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="groq">
                        <CustomAccordionTrigger icon={<Bot className="h-5 w-5"/>} title="Groq (Fallback)" />
                        <AccordionContent className="space-y-4 pt-4">
                            <ServiceStatusToggle providerId="groq" isConfigured={!!settings.groqApiKey} providerStatus={providerStatus} onStatusChange={handleStatusChange} />
                            <div className="space-y-2">
                                <Label htmlFor="groq-key">Groq API Key</Label>
                                <Input id="groq-key" type="password" placeholder="Your Groq API Key" value={settings.groqApiKey || ''} onChange={(e) => handleInputChange('groqApiKey', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="groq-model-name">Groq Model</Label>
                                <Select value={settings.groqModelName || defaultModels.groqModelName} onValueChange={(value) => handleModelChange('groqModelName', value)}>
                                    <SelectTrigger><SelectValue placeholder="Select a model..." /></SelectTrigger>
                                    <SelectContent>
                                        {modelOptions.groq.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                     <AccordionItem value="discord">
                        <CustomAccordionTrigger icon={<Bot className="h-5 w-5"/>} title="Discord Integration" />
                        <AccordionContent className="space-y-4 pt-4">
                            <ServiceStatusToggle providerId="discord" isConfigured={!!settings.discordWebhook || !!settings.discordToken} providerStatus={providerStatus} onStatusChange={handleStatusChange} />
                            <div className="space-y-2">
                                <Label htmlFor="discord-token">Discord Bot Token (For Python Bot)</Label>
                                <Input id="discord-token" type="password" placeholder="Needed to run the separate Python bot" value={settings.discordToken || ''} onChange={(e) => handleInputChange('discordToken', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="discord-webhook">Discord Webhook URL (For App to Send)</Label>
                                <Input id="discord-webhook" type="text" placeholder="For sending messages from this app to Discord" value={settings.discordWebhook || ''} onChange={(e) => handleInputChange('discordWebhook', e.target.value)} />
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                     <AccordionItem value="twitch">
                        <CustomAccordionTrigger icon={<Bot className="h-5 w-5"/>} title="Twitch Integration" />
                        <AccordionContent className="space-y-4 pt-4">
                            <ServiceStatusToggle providerId="twitch" isConfigured={!!settings.twitchToken} providerStatus={providerStatus} onStatusChange={handleStatusChange} />
                            <div className="space-y-2">
                                <Label htmlFor="twitch-token">Twitch Bot Token (Optional)</Label>
                                <Input id="twitch-token" type="password" placeholder="For direct Twitch bot actions" value={settings.twitchToken || ''} onChange={(e) => handleInputChange('twitchToken', e.target.value)} />
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="streamerbot">
                        <CustomAccordionTrigger icon={<Radio className="h-5 w-5"/>} title="Streamer.bot Integration" />
                        <AccordionContent className="space-y-4 pt-4">
                            <ServiceStatusToggle providerId="streamerbot" isConfigured={true} providerStatus={providerStatus} onStatusChange={handleStatusChange} />
                            <div className="space-y-2">
                                <Label htmlFor="streamerbot-address">Server Address</Label>
                                <Input id="streamerbot-address" type="text" placeholder="127.0.0.1" value={settings.streamerbotServerAddress || ''} onChange={(e) => handleInputChange('streamerbotServerAddress', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="streamerbot-port">Server Port</Label>
                                <Input id="streamerbot-port" type="text" placeholder="9003" value={settings.streamerbotServerPort || ''} onChange={(e) => handleInputChange('streamerbotServerPort', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="streamerbot-request-type">Request Type</Label>
                                <Select value={settings.streamerbotRequestType || 'DoAction'} onValueChange={(value) => handleInputChange('streamerbotRequestType', value as string)}>
                                    <SelectTrigger><SelectValue placeholder="Select a request type..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DoAction">Do Action</SelectItem>
                                        <SelectItem value="BroadcastMessage">Broadcast Message</SelectItem>
                                        <SelectItem value="SetGlobalVariable">Set Global Variable</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {settings.streamerbotRequestType === 'DoAction' && (
                                <div className="space-y-2">
                                    <Label htmlFor="streamerbot-action-name">Action Name</Label>
                                    <Input id="streamerbot-action-name" type="text" placeholder="e.g., Nexus Hub Message" value={settings.streamerbotActionName || ''} onChange={(e) => handleInputChange('streamerbotActionName', e.target.value)} />
                                </div>
                            )}
                            {settings.streamerbotRequestType === 'SetGlobalVariable' && (
                                <div className="space-y-2">
                                    <Label htmlFor="streamerbot-variable-name">Variable Name</Label>
                                    <Input id="streamerbot-variable-name" type="text" placeholder="e.g., nexusMessage" value={settings.streamerbotVariableName || ''} onChange={(e) => handleInputChange('streamerbotVariableName', e.target.value)} />
                                    <p className="text-xs text-muted-foreground">The message from Unified Chat will be set as the value for this variable.</p>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="streamerbot-webhook-url">Streamer.bot Webhook URL (for events)</Label>
                                <Input id="streamerbot-webhook-url" type="text" value={settings.streamerbotWebhookUrl || ''} onChange={(e) => handleInputChange('streamerbotWebhookUrl', e.target.value)} />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    
                     <AccordionItem value="nexusconnect">
                        <CustomAccordionTrigger icon={<Link className="h-5 w-5"/>} title="Nexus Connect" />
                        <AccordionContent className="space-y-4 pt-4">
                            <ServiceStatusToggle providerId="nexusconnect" isConfigured={true} providerStatus={providerStatus} onStatusChange={handleStatusChange} />
                            <div className="space-y-2">
                                <Label htmlFor="nexus-webhook-url">Your Inbound Webhook URL (Share this)</Label>
                                <div className="flex items-center gap-2">
                                    <Input id="nexus-webhook-url" type="text" value={settings.nexusConnectWebhookUrl || ''} readOnly />
                                    <Button type="button" variant="outline" size="icon" onClick={() => copyToClipboard(settings.nexusConnectWebhookUrl || '')}><Copy className="h-4 w-4"/></Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Outbound Connections (Send to these URLs)</Label>
                                <div className="space-y-2">
                                    {(settings.nexusConnectConnections || []).map((conn, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <Input 
                                                type="text" 
                                                placeholder="Enter another user's webhook URL"
                                                value={conn}
                                                onChange={(e) => handleConnectionChange(index, e.target.value)}
                                            />
                                            <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveConnection(index)}><Trash2 className="h-4 w-4"/></Button>
                                        </div>
                                    ))}
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={handleAddConnection}><PlusCircle className="mr-2 h-4 w-4"/>Add Connection</Button>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                <div className="flex justify-end pt-4">
                  <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    Save Configuration
                  </Button>
                </div>
              </form>
            </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
}

    