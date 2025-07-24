
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Save, LifeBuoy, Power, Bot, PlusCircle, Trash2, Link, Copy, Server, KeyRound, RefreshCw, Radio, GripVertical, EyeOff, Lock, Unlock, Cpu, Share2, Star, Languages, AudioLines, AlertTriangle, Database } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLogs } from '@/context/LogContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { PopOutButton } from './pop-out-button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import VaultConfig from '@/../vault.config.json';
import { CommunityLogo } from '../icons/community-logo';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


const UNLOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export const settingKeys = [
  'edenApiKey', 'edenAiProvider', 'edenAiModel', 'googleApiKey', 'googleModelName',
  'openaiApiKey', 'openaiModelName', 'groqApiKey', 'groqModelName',
  'discordToken', 'discordWebhook', 'twitchToken', 'providerStatus',
  'streamerbotServerAddress', 'streamerbotServerPort', 'streamerbotRequestType', 'streamerbotActionName', 'streamerbotVariableName', 'streamerbotWebhookUrl',
  'nexusConnectWebhookUrl', 'nexusConnectConnections', 'remoteHubAddress', 'remoteAccessSecret',
  'ttsProvider', 'sttProvider', 'translationProvider', 'vaultPassword',
  'firebaseApiKey', 'firebaseAuthDomain', 'firebaseProjectId', 'firebaseStorageBucket', 'firebaseMessagingSenderId', 'firebaseAppId', 'firebaseMeasurementId'
] as const;

export type SettingKey = typeof settingKeys[number];

type SettingsObjectKey = Exclude<SettingKey, 'providerStatus' | 'nexusConnectConnections'>;

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

const defaultModels = {
    edenAiModel: 'openai/gpt-4-turbo',
    googleModelName: 'gemini-1.5-flash-latest',
    openaiModelName: 'gpt-4o',
    groqModelName: 'llama3-8b-8192',
};

const popularModels = {
    google: ['gemini-1.5-flash-latest', 'gemini-1.5-pro-latest', 'gemini-1.0-pro'],
    openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    groq: ['llama3-8b-8192', 'llama3-70b-8192', 'mixtral-8x7b-32768', 'gemma-7b-it'],
    eden: {
        openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
        google: ['gemini-1.5-flash-latest', 'gemini-1.5-pro-latest'],
        anthropic: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
        cohere: ['command-r', 'command-r-plus'],
        meta: ['llama3-8b-8192', 'llama3-70b-8192']
    }
};

const serviceProviders = {
    tts: ['google', 'openai', 'elevenlabs', 'microsoft', 'amazon', 'lovoai'],
    stt: ['deepgram', 'openai', 'gladia', 'assemblyai', 'microsoft', 'google', 'amazon', 'speechmatics', 'symblai'],
    translation: ['google', 'deepl', 'microsoft', 'amazon', 'openai', 'modernmt']
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
  streamerbotActionName: 'Apollo Station Message',
  streamerbotVariableName: 'spcmtnMessage',
  streamerbotWebhookUrl: typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}/api/streamerbot-relay` : '',
  nexusConnectWebhookUrl: typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}/api/nexus-connect` : '',
  nexusConnectConnections: [],
  remoteHubAddress: '',
  remoteAccessSecret: '',
  ttsProvider: 'google',
  sttProvider: 'openai',
  translationProvider: 'google',
}

const PROVIDER_CONFIG = {
    eden: { name: 'Eden AI', icon: <Star className="h-5 w-5 text-primary" /> },
    google: { name: 'Google AI', icon: <Bot className="h-5 w-5 text-primary" /> },
    openai: { name: 'OpenAI', icon: <Bot className="h-5 w-5 text-primary" /> },
    groq: { name: 'Groq', icon: <Bot className="h-5 w-5 text-primary" /> },
};


const FALLBACK_ORDER: AiProviderId[] = ['google', 'openai', 'groq'];

const ServiceStatusToggle: React.FC<{
  providerId: ProviderId;
  isConfigured: boolean;
  providerStatus: ProviderStatus;
  onStatusChange: (providerId: ProviderId, enabled: boolean) => void;
  isLocked: boolean;
}> = ({ providerId, isConfigured, providerStatus, onStatusChange, isLocked }) => {
  const isEnabled = providerStatus[providerId] === 'enabled';
  const lightColor = !isConfigured ? 'bg-muted' : isEnabled ? 'bg-primary' : 'bg-destructive';

  return (
    <div className="space-y-2">
      <Label htmlFor={`${providerId}-status`} className="flex items-center gap-2 text-xs">
        <Power className="h-4 w-4 text-primary" />
        Service Status
      </Label>
      <div className="flex items-center gap-3">
        <Switch
          id={`${providerId}-status`}
          checked={isEnabled}
          onCheckedChange={(checked) => onStatusChange(providerId, checked)}
          disabled={!isConfigured || isLocked}
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
    dragHandleProps?: any;
    isPreview?: boolean;
    onHide?: () => void;
    onPopOut?: () => void;
}

export function ApiSettings({ isPoppedOut = false, dragHandleProps, isPreview, onHide, onPopOut }: ApiSettingsProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [providerStatus, setProviderStatus] = useState<ProviderStatus>(defaultProviderStatus);
  const { addLog } = useLogs();
  const [openAccordions, setOpenAccordions] = useState<string[]>(['ai-providers']);

  const [isLocked, setIsLocked] = useState(true);
  const [password, setPassword] = useState('');
  const [unlockTimestamp, setUnlockTimestamp] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const lockTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const [customModels, setCustomModels] = useState<{ [key: string]: string }>({});
  
  const [vaultPassword, setVaultPassword] = useState<string | null>(null);
  const [isPasswordFromFile, setIsPasswordFromFile] = useState(false);

  useEffect(() => {
    if (isPreview) return;
    
    if (VaultConfig && VaultConfig.password) {
        setVaultPassword(VaultConfig.password);
        setIsPasswordFromFile(true);
    } else {
        setVaultPassword(localStorage.getItem('vaultPassword'));
        setIsPasswordFromFile(false);
    }

    try {
        const loadedSettings: Partial<Settings> = {};
        const keysToLoad: SettingsObjectKey[] = settingKeys.filter((k): k is SettingsObjectKey => !['providerStatus', 'nexusConnectConnections'].includes(k));

        for (const key of keysToLoad) {
            const value = localStorage.getItem(key);
            if (value !== null) {
                loadedSettings[key as SettingsObjectKey] = value;
            }
        }
        
        let savedConnections = localStorage.getItem('nexusConnectConnections');
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
        setSettings(finalSettings);

        const tempCustomModels: { [key: string]: string } = {};
        Object.keys(defaultModels).forEach(key => {
            const modelKey = key as keyof typeof defaultModels;
            const savedModel = finalSettings[modelKey];
            const allPopularModels = Object.values(popularModels).flat(2);
            if (savedModel && !allPopularModels.includes(savedModel) && !Object.values(popularModels.eden).flat().some(m => `openai/${m}` === savedModel)) {
                if(key !== 'edenAiModel') {
                    tempCustomModels[modelKey] = savedModel;
                    finalSettings[modelKey] = 'custom';
                }
            }
        });
        setCustomModels(tempCustomModels);


        addLog({ service: 'System', level: 'info', message: 'API Key Vault settings loaded.' });
    } catch (error) {
        console.error("Failed to load settings from local storage", error);
        addLog({ service: 'System', level: 'error', message: 'Failed to load settings from local storage.', details: error instanceof Error ? error.stack : String(error) });
    }
  }, [addLog, isPreview]);
  
  useEffect(() => {
    if (unlockTimestamp) {
        countdownRef.current = setInterval(() => {
            const now = Date.now();
            const remaining = unlockTimestamp - now;
            if (remaining > 0) {
                setTimeLeft(Math.ceil(remaining / 1000));
            } else {
                setIsLocked(true);
                setUnlockTimestamp(null);
                setPassword('');
                toast({ title: "Vault Locked", description: "The vault has been automatically locked due to inactivity." });
                addLog({ service: 'System', level: 'warn', message: 'API Key Vault has been automatically locked.' });
            }
        }, 1000);
    }
    return () => {
        if(countdownRef.current) clearInterval(countdownRef.current);
    }
  }, [unlockTimestamp, toast, addLog]);

  useEffect(() => {
    return () => { 
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    }
  }, []);

  const handleUnlock = () => {
    if (password === vaultPassword) {
        setIsLocked(false);
        const newUnlockTimestamp = Date.now() + UNLOCK_DURATION_MS;
        setUnlockTimestamp(newUnlockTimestamp);
        toast({ title: "Vault Unlocked", description: "You can now edit settings for the next 5 minutes." });
        addLog({ service: 'System', level: 'info', message: 'API Key Vault unlocked by user.' });
        
        lockTimerRef.current = setTimeout(() => {
            setIsLocked(true);
            setUnlockTimestamp(null);
            setPassword('');
            toast({ title: "Vault Locked", description: "The vault has been automatically locked." });
            addLog({ service: 'System', level: 'warn', message: 'API Key Vault has been automatically locked.' });
        }, UNLOCK_DURATION_MS);
    } else {
        toast({ title: "Incorrect Password", variant: "destructive" });
        addLog({ service: 'System', level: 'error', message: 'User entered incorrect vault password.' });
    }
  }

  const handleInputChange = (key: keyof typeof settings, value: string | string[]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleModelSelect = (key: keyof typeof defaultModels, value: string) => {
    if (value === 'custom') {
        handleInputChange(key, 'custom');
    } else {
        handleInputChange(key, value);
        setCustomModels(prev => {
            const newCustoms = { ...prev };
            delete newCustoms[key];
            return newCustoms;
        });
    }
  };

  const handleCustomModelChange = (key: keyof typeof defaultModels, value: string) => {
    setCustomModels(prev => ({ ...prev, [key]: value }));
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
    handleInputChange('remoteAccessSecret', `smos_sec_${secret}`);
    toast({ title: "Secret Key Generated", description: "A new secret key has been generated and placed in the field." });
    addLog({ service: 'System', level: 'info', message: 'New remote access secret key generated.' });
  };
  
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const settingsToSave: Partial<Settings> = { ...settings };
      const modelKeys: (keyof typeof defaultModels)[] = ['googleModelName', 'openaiModelName', 'groqModelName', 'edenAiModel'];
      
      for (const key of modelKeys) {
          if (settingsToSave[key as keyof Settings] === 'custom') {
              settingsToSave[key as keyof Settings] = customModels[key] || defaultModels[key];
          } else if (!settingsToSave[key as keyof Settings]) {
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
      
      localStorage.setItem('providerStatus', JSON.stringify(providerStatus));
      localStorage.setItem('fallbackStrategy', JSON.stringify(FALLBACK_ORDER));
      localStorage.setItem('apiSettingsOpen', JSON.stringify(openAccordions));
      
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
  
  const copyToClipboard = (text: string) => {
    if(!text) return;
    navigator.clipboard.writeText(text).then(() => {
        toast({ title: "Copied to Clipboard", description: "Webhook URL has been copied." });
    }, (err) => {
        toast({ title: "Copy Failed", description: "Could not copy the URL.", variant: "destructive" });
    });
  };

  const handleClearSettings = () => {
    try {
      addLog({ service: 'System', level: 'warn', message: 'User initiated reset of all local settings.' });
      
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => localStorage.removeItem(key));
      
      toast({
        title: "Settings Cleared",
        description: "All local settings have been removed. Reloading application.",
      });
      
      setTimeout(() => window.location.href = '/launcher-ui', 1000);

    } catch (error) {
       toast({
        title: "Clear Failed",
        description: "Could not clear settings. Your browser might be blocking local storage.",
        variant: "destructive",
      });
      addLog({ service: 'System', level: 'error', message: "Failed to clear all local settings.", details: error instanceof Error ? error.stack : String(error) });
    }
  };

  const timeFormatter = new Intl.DateTimeFormat('en', { minute: '2-digit', second: '2-digit' });

  const getEdenProviderFromModel = () => {
    const model = settings.edenAiModel || defaultModels.edenAiModel;
    if (model.includes('/')) {
        return model.split('/')[0];
    }
    return 'openai';
  };

  const edenProvider = getEdenProviderFromModel();
  const edenModelsForProvider = popularModels.eden[edenProvider as keyof typeof popularModels.eden] || [];


  return (
    <Card className="flex flex-col h-full bg-secondary/20">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2 flex-grow">
            <Button variant="ghost" size="icon" {...dragHandleProps} className="cursor-grab p-1 h-auto w-auto text-accent">
              <GripVertical />
            </Button>
            <div className='flex-grow flex items-center gap-2'>
              <ShieldCheck className="w-6 h-6 text-primary" />
              <div>
                <CardTitle>
                  API Key Vault
                </CardTitle>
                <CardDescription>Manage all your secret keys and connection endpoints here.</CardDescription>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
              {!isPoppedOut && onHide && (
                 <Button variant="ghost" size="icon" onClick={onHide} className="text-destructive">
                  <EyeOff className="h-4 w-4" />
                </Button>
              )}
              {!isPoppedOut && onPopOut && <PopOutButton onClick={onPopOut} />}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col gap-4 overflow-hidden">
        <div className="mb-4 p-4 border rounded-lg bg-background">
          <Label htmlFor="vault-password">Vault Password</Label>
          <div className="flex items-center gap-2 mt-1">
              <Input 
                  id="vault-password"
                  type="password"
                  placeholder="Enter password to unlock"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                  disabled={!isLocked || !vaultPassword}
                  className="bg-secondary"
              />
              <Button onClick={handleUnlock} disabled={!isLocked || !vaultPassword}>
                  <Unlock className="h-4 w-4" />
              </Button>
          </div>
          {isPasswordFromFile ? (
             <Alert variant="default" className="mt-4">
                <Lock className="h-4 w-4 text-primary" />
                <AlertTitle>Password Locked by Config</AlertTitle>
                <AlertDescription>
                   The vault password is set in `vault.config.json` and cannot be changed here.
                </AlertDescription>
            </Alert>
          ) : !vaultPassword && (
              <Alert variant="destructive" className="mt-4">
                  <Lock className="h-4 w-4" />
                  <AlertTitle>No Vault Password Set</AlertTitle>
                  <AlertDescription>
                     Please run the Setup Wizard to secure your vault.
                  </AlertDescription>
              </Alert>
          )}
          {!isLocked && (
               <Alert variant="default" className="mt-4">
                  <Unlock className="h-4 w-4 text-primary" />
                  <AlertTitle>Vault Unlocked</AlertTitle>
                  <AlertDescription>
                     Vault will automatically lock in {timeFormatter.format(new Date(timeLeft * 1000))}.
                  </AlertDescription>
              </Alert>
          )}
        </div>
        <ScrollArea className="flex-grow pr-4 -mr-4">
          <form id="api-settings-form" className="space-y-4" onSubmit={handleSaveChanges}>
            <Accordion type="multiple" value={openAccordions} onValueChange={handleAccordionChange} className="w-full space-y-2">
                <AccordionItem value="ai-providers">
                    <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                        <div className="flex items-center gap-2">
                            <Cpu className="h-5 w-5 text-primary"/>
                            AI Providers
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4 pl-2 border-l-2 border-primary/20">
                        <div className="space-y-4 p-3 border rounded-md bg-primary">
                            <h4 className="font-semibold flex items-center gap-2">{PROVIDER_CONFIG.eden.icon} {PROVIDER_CONFIG.eden.name} (Primary)</h4>
                            <div className="space-y-2">
                                <Label htmlFor="eden-key">Eden AI API Key</Label>
                                <Input id="eden-key" type="password" placeholder="Your primary key from Eden AI" value={settings.edenApiKey || ''} onChange={(e) => handleInputChange('edenApiKey', e.target.value)} disabled={isLocked} className="bg-secondary"/>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="eden-provider">Provider via Eden</Label>
                                    <Select value={edenProvider} onValueChange={(value) => handleInputChange('edenAiModel', `${value}/${popularModels.eden[value as keyof typeof popularModels.eden][0]}`)} disabled={isLocked}>
                                        <SelectTrigger className="bg-secondary"><SelectValue placeholder="Select a provider..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="openai">OpenAI</SelectItem>
                                            <SelectItem value="google">Google</SelectItem>
                                            <SelectItem value="anthropic">Anthropic</SelectItem>
                                            <SelectItem value="cohere">Cohere</SelectItem>
                                            <SelectItem value="meta">Meta</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="eden-model">Model Name via Eden</Label>
                                    <Select value={settings.edenAiModel || ''} onValueChange={(value) => handleInputChange('edenAiModel', value)} disabled={isLocked}>
                                        <SelectTrigger className="bg-secondary"><SelectValue placeholder="Select a model..." /></SelectTrigger>
                                        <SelectContent>
                                        {edenModelsForProvider.map(model => (
                                            <SelectItem key={model} value={`${edenProvider}/${model}`}>{model}</SelectItem>
                                        ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        {(['google', 'openai', 'groq'] as const).map((providerId) => (
                             <div key={providerId} className="space-y-4 p-3 border rounded-md bg-primary">
                                <h4 className="font-semibold flex items-center gap-2">{PROVIDER_CONFIG[providerId].icon} {PROVIDER_CONFIG[providerId].name} (Fallback)</h4>
                                <ServiceStatusToggle providerId={providerId} isConfigured={!!settings[`${providerId}ApiKey`]} providerStatus={providerStatus} onStatusChange={handleStatusChange} isLocked={isLocked}/>
                                <div className="space-y-2">
                                    <Label htmlFor={`${providerId}-ai-key`}>{`${PROVIDER_CONFIG[providerId].name}`} API Key</Label>
                                    <Input id={`${providerId}-ai-key`} type="password" placeholder={`Your ${PROVIDER_CONFIG[providerId].name} API Key`} value={settings[`${providerId}ApiKey`] || ''} onChange={(e) => handleInputChange(`${providerId}ApiKey`, e.target.value)} disabled={isLocked} className="bg-secondary"/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`${providerId}-model-name`}>{`${PROVIDER_CONFIG[providerId].name}`} Model Name</Label>
                                    <Select value={settings[`${providerId}ModelName`] || defaultModels[`${providerId}ModelName`]} onValueChange={(value) => handleModelSelect(`${providerId}ModelName`, value)} disabled={isLocked}>
                                        <SelectTrigger className="bg-secondary"><SelectValue placeholder="Select a model..." /></SelectTrigger>
                                        <SelectContent>
                                            {popularModels[providerId].map(model => (
                                                <SelectItem key={model} value={model}>{model}</SelectItem>
                                            ))}
                                            <SelectItem value="custom">Custom...</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {settings[`${providerId}ModelName`] === 'custom' && (
                                <div className="space-y-2 pl-2 border-l-2 border-primary">
                                    <Label htmlFor={`${providerId}-custom-model`}>Custom Model ID</Label>
                                    <Input 
                                        id={`${providerId}-custom-model`}
                                        placeholder="Enter your fine-tuned model ID"
                                        value={customModels[`${providerId}ModelName`] || ''}
                                        onChange={(e) => handleCustomModelChange(`${providerId}ModelName`, e.target.value)}
                                        disabled={isLocked}
                                        className="bg-secondary"
                                    />
                                </div>
                                )}
                             </div>
                        ))}
                    </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="firebase-config">
                    <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                        <div className="flex items-center gap-2">
                            <Database className="h-5 w-5 text-primary"/>
                            Firebase Configuration
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4 pl-2 border-l-2 border-primary/20">
                        <div className="space-y-4 p-3 border rounded-md bg-primary">
                           <p className="text-sm text-muted-foreground">These settings are required for the "Shared Bot Store" feature. You can find them in your Firebase project settings.</p>
                            <div className="space-y-2">
                                <Label htmlFor="firebaseApiKey">API Key</Label>
                                <Input id="firebaseApiKey" type="password" placeholder="Firebase Web API Key" value={settings.firebaseApiKey || ''} onChange={(e) => handleInputChange('firebaseApiKey', e.target.value)} disabled={isLocked} className="bg-secondary"/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="firebaseAuthDomain">Auth Domain</Label>
                                <Input id="firebaseAuthDomain" type="text" placeholder="your-project.firebaseapp.com" value={settings.firebaseAuthDomain || ''} onChange={(e) => handleInputChange('firebaseAuthDomain', e.target.value)} disabled={isLocked} className="bg-secondary"/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="firebaseProjectId">Project ID</Label>
                                <Input id="firebaseProjectId" type="text" placeholder="your-project-id" value={settings.firebaseProjectId || ''} onChange={(e) => handleInputChange('firebaseProjectId', e.target.value)} disabled={isLocked} className="bg-secondary"/>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="firebaseStorageBucket">Storage Bucket</Label>
                                <Input id="firebaseStorageBucket" type="text" placeholder="your-project.appspot.com" value={settings.firebaseStorageBucket || ''} onChange={(e) => handleInputChange('firebaseStorageBucket', e.target.value)} disabled={isLocked} className="bg-secondary"/>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="firebaseMessagingSenderId">Messaging Sender ID</Label>
                                <Input id="firebaseMessagingSenderId" type="text" placeholder="1234567890" value={settings.firebaseMessagingSenderId || ''} onChange={(e) => handleInputChange('firebaseMessagingSenderId', e.target.value)} disabled={isLocked} className="bg-secondary"/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="firebaseAppId">App ID</Label>
                                <Input id="firebaseAppId" type="text" placeholder="1:12345:web:67890" value={settings.firebaseAppId || ''} onChange={(e) => handleInputChange('firebaseAppId', e.target.value)} disabled={isLocked} className="bg-secondary"/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="firebaseMeasurementId">Measurement ID</Label>
                                <Input id="firebaseMeasurementId" type="text" placeholder="G-XXXXXXXXXX" value={settings.firebaseMeasurementId || ''} onChange={(e) => handleInputChange('firebaseMeasurementId', e.target.value)} disabled={isLocked} className="bg-secondary"/>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="service-integrations">
                    <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                        <div className="flex items-center gap-2">
                            <Share2 className="h-5 w-5 text-primary"/>
                            Service Integrations
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4 pl-2 border-l-2 border-primary/20">
                        <div className="space-y-4 p-3 border rounded-md bg-primary">
                           <h4 className="font-semibold flex items-center gap-2"><Bot className="h-5 w-5 text-primary"/> Discord</h4>
                           <ServiceStatusToggle providerId="discord" isConfigured={!!settings.discordWebhook || !!settings.discordToken} providerStatus={providerStatus} onStatusChange={handleStatusChange} isLocked={isLocked}/>
                           <div className="space-y-2">
                                <Label htmlFor="discord-token">Discord Bot Token (For Python Bot)</Label>
                                <Input id="discord-token" type="password" placeholder="Needed to run the separate Python bot" value={settings.discordToken || ''} onChange={(e) => handleInputChange('discordToken', e.target.value)} disabled={isLocked} className="bg-secondary"/>
                           </div>
                           <div className="space-y-2">
                                <Label htmlFor="discord-webhook">Discord Webhook URL (For App to Send)</Label>
                                <Input id="discord-webhook" type="password" placeholder="For sending messages from this app to Discord" value={settings.discordWebhook || ''} onChange={(e) => handleInputChange('discordWebhook', e.target.value)} disabled={isLocked} className="bg-secondary"/>
                           </div>
                        </div>
                        <div className="space-y-4 p-3 border rounded-md bg-primary">
                           <h4 className="font-semibold flex items-center gap-2"><Bot className="h-5 w-5 text-primary"/> Twitch</h4>
                           <ServiceStatusToggle providerId="twitch" isConfigured={!!settings.twitchToken} providerStatus={providerStatus} onStatusChange={handleStatusChange} isLocked={isLocked}/>
                            <div className="space-y-2">
                                <Label htmlFor="twitch-token">Twitch Bot Token (Optional)</Label>
                                <Input id="twitch-token" type="password" placeholder="For direct Twitch bot actions" value={settings.twitchToken || ''} onChange={(e) => handleInputChange('twitchToken', e.target.value)} disabled={isLocked} className="bg-secondary"/>
                            </div>
                        </div>
                        <div className="space-y-4 p-3 border rounded-md bg-primary">
                           <h4 className="font-semibold flex items-center gap-2"><Radio className="h-5 w-5 text-primary"/> Streamer.bot</h4>
                           <ServiceStatusToggle providerId="streamerbot" isConfigured={true} providerStatus={providerStatus} onStatusChange={handleStatusChange} isLocked={isLocked}/>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="streamerbot-address">Server Address</Label>
                                    <Input id="streamerbot-address" type="text" placeholder="127.0.0.1" value={settings.streamerbotServerAddress || ''} onChange={(e) => handleInputChange('streamerbotServerAddress', e.target.value)} disabled={isLocked} className="bg-secondary"/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="streamerbot-port">Server Port</Label>
                                    <Input id="streamerbot-port" type="text" placeholder="9003" value={settings.streamerbotServerPort || ''} onChange={(e) => handleInputChange('streamerbotServerPort', e.target.value)} disabled={isLocked} className="bg-secondary"/>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="streamerbot-webhook-url">Streamer.bot Webhook URL (for events)</Label>
                                <Input id="streamerbot-webhook-url" type="text" value={settings.streamerbotWebhookUrl || ''} onChange={(e) => handleInputChange('streamerbotWebhookUrl', e.target.value)} disabled={isLocked} className="bg-secondary"/>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="audio-language">
                    <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                        <div className="flex items-center gap-2">
                            <AudioLines className="h-5 w-5 text-primary"/>
                            Audio & Language
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4 pl-2 border-l-2 border-primary/20">
                        <div className="space-y-4 p-3 border rounded-md bg-primary">
                            <h4 className="font-semibold">Provider Selection</h4>
                            <div className="space-y-2">
                                <Label htmlFor="tts-provider">Text-to-Speech Provider</Label>
                                <Select value={settings.ttsProvider || 'google'} onValueChange={(value) => handleInputChange('ttsProvider', value)} disabled={isLocked}>
                                    <SelectTrigger className="bg-secondary"><SelectValue placeholder="Select a provider..." /></SelectTrigger>
                                    <SelectContent>
                                        {serviceProviders.tts.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="stt-provider">Speech-to-Text Provider</Label>
                                <Select value={settings.sttProvider || 'openai'} onValueChange={(value) => handleInputChange('sttProvider', value)} disabled={isLocked}>
                                    <SelectTrigger className="bg-secondary"><SelectValue placeholder="Select a provider..." /></SelectTrigger>
                                    <SelectContent>
                                        {serviceProviders.stt.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="translation-provider">Translation Provider</Label>
                                <Select value={settings.translationProvider || 'google'} onValueChange={(value) => handleInputChange('translationProvider', value)} disabled={isLocked}>
                                    <SelectTrigger className="bg-secondary"><SelectValue placeholder="Select a provider..." /></SelectTrigger>
                                    <SelectContent>
                                        {serviceProviders.translation.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="connectivity">
                    <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                        <div className="flex items-center gap-2">
                           <Link className="h-5 w-5 text-primary"/>
                            Connectivity
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4 pl-2 border-l-2 border-primary/20">
                        <div className="space-y-4 p-3 border rounded-md bg-primary">
                           <h4 className="font-semibold flex items-center gap-2"><Server className="h-5 w-5 text-primary"/> Remote Access</h4>
                           <div className="space-y-2">
                               <Label htmlFor="remote-hub-address">Remote Hub Address</Label>
                               <Input 
                                   id="remote-hub-address" 
                                   type="text" 
                                   placeholder="e.g., https://your-tunnel.ngrok.io" 
                                   value={settings.remoteHubAddress || ''} 
                                   onChange={(e) => handleInputChange('remoteHubAddress', e.target.value)} 
                                   disabled={isLocked}
                                   className="bg-secondary"
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
                                    disabled={isLocked}
                                    className="bg-secondary"
                                    />
                                    <Button type="button" variant="outline" size="icon" onClick={generateSecretKey} aria-label="Generate new secret key" disabled={isLocked}>
                                        <RefreshCw className="h-4 w-4"/>
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    This key must be identical on both your local hub and your cloud-hosted UI for the connection to work.
                                </p>
                           </div>
                        </div>
                        <div className="space-y-4 p-3 border rounded-md bg-primary">
                            <h4 className="font-semibold flex items-center gap-2"><Link className="h-5 w-5 text-primary"/> Nexus Connect</h4>
                             <ServiceStatusToggle providerId="nexusconnect" isConfigured={true} providerStatus={providerStatus} onStatusChange={handleStatusChange} isLocked={isLocked}/>
                            <div className="space-y-2">
                                <Label htmlFor="nexus-webhook-url">Your Inbound Webhook URL (Share this)</Label>
                                <div className="flex items-center gap-2">
                                    <Input id="nexus-webhook-url" type="text" value={settings.nexusConnectWebhookUrl || ''} readOnly disabled={isLocked} className="bg-secondary"/>
                                    <Button type="button" variant="outline" size="icon" onClick={() => copyToClipboard(settings.nexusConnectWebhookUrl || '')} disabled={isLocked}><Copy className="h-4 w-4"/></Button>
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
                                                disabled={isLocked}
                                                className="bg-secondary"
                                            />
                                            <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveConnection(index)} disabled={isLocked}><Trash2 className="h-4 w-4"/></Button>
                                        </div>
                                    ))}
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={handleAddConnection} disabled={isLocked}><PlusCircle className="mr-2 h-4 w-4"/>Add Connection</Button>
                            </div>
                        </div>
                    </AccordionContent>
                 </AccordionItem>
                 <AccordionItem value="danger-zone">
                    <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive"/>
                            Danger Zone
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4 pl-2 border-l-2 border-destructive/20">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={isLocked}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Reset All Application Data
                            </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                This will permanently delete all API keys, settings, and layouts from your browser. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleClearSettings}>
                                Yes, reset everything
                                </AlertDialogAction>
                            </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                         <p className="text-xs text-muted-foreground">This will wipe all data stored in your browser for this application, including all saved API keys, bot personalities, and layout settings.</p>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
          </form>
        </ScrollArea>
        <div className="mt-auto flex justify-end pt-4 border-t">
          <Button type="submit" form="api-settings-form" disabled={isLocked}>
            <Save className="mr-2 h-4 w-4" />
            Save Configuration
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
