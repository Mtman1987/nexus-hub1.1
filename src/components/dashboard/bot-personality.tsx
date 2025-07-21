
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bot, PlusCircle, Trash2, GripVertical, EyeOff, Save, Smile, Download, Upload, Store } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLogs } from '@/context/LogContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PopOutButton } from './pop-out-button';
import { useBotName } from '@/context/BotNameContext';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';

export type BotPersonalityType = {
  id: string;
  name: string;
  prompt: string;
  isDefault?: boolean;
}

const BOT_STORE_KEY = 'apollo-station-bot-store';

const defaultPersonalities: BotPersonalityType[] = [
    {
        id: 'default-cosmo', 
        name: 'COSMO', 
        prompt: 'You are COSMO (Central Operating System Management Orbiter), the AI assistant for Apollo Station, the community\'s HQ, created by mtman1987. Your purpose is to act as a creative partner and lore master.',
        isDefault: true,
    }
];

interface BotPersonalityProps {
    onPopOut?: () => void;
    isPoppedOut?: boolean;
    onHide?: () => void;
    dragHandleProps?: any;
}

export function BotPersonality({ onPopOut, isPoppedOut = false, onHide, dragHandleProps }: BotPersonalityProps) {
  const { toast } = useToast();
  const { addLog } = useLogs();
  const { setBotName } = useBotName();

  const [personalities, setPersonalities] = useState<BotPersonalityType[]>(defaultPersonalities);
  const [selectedPersonalityId, setSelectedPersonalityId] = useState<string | null>(defaultPersonalities[0].id);
  const [botStore, setBotStore] = useState<Omit<BotPersonalityType, 'id' | 'isDefault'>[]>([]);

  const loadBotStore = useCallback(() => {
    try {
        const storedBots = localStorage.getItem(BOT_STORE_KEY);
        if (storedBots) {
            setBotStore(JSON.parse(storedBots));
        }
    } catch (e) {
        console.error("Failed to load bot store", e);
    }
  }, []);

  useEffect(() => {
    try {
        const savedPersonalities = localStorage.getItem('botPersonalities');
        const loadedPersonalities = savedPersonalities ? JSON.parse(savedPersonalities) : defaultPersonalities;
        setPersonalities(loadedPersonalities);

        const savedSelectedId = localStorage.getItem('selectedPersonalityId');
        const selectedId = savedSelectedId && loadedPersonalities.some((p: BotPersonalityType) => p.id === savedSelectedId) ? savedSelectedId : loadedPersonalities[0]?.id;
        setSelectedPersonalityId(selectedId);
        
        const selectedPersonality = loadedPersonalities.find((p: BotPersonalityType) => p.id === selectedId);
        if (selectedPersonality) {
            setBotName(selectedPersonality.name);
        }
        
        loadBotStore();
        addLog({ service: 'System', level: 'info', message: 'Bot Personality settings loaded.' });
    } catch (error) {
        console.error("Failed to load personality settings", error);
        addLog({ service: 'System', level: 'error', message: 'Failed to load personality settings from local storage.', details: error instanceof Error ? error.stack : String(error) });
    }
  }, [setBotName, addLog, loadBotStore]);
  
  const handlePersonalityChange = (field: 'name' | 'prompt', value: string) => {
    if (!selectedPersonalityId) return;

    setPersonalities(prev => prev.map(p => {
        if (p.id === selectedPersonalityId) {
            if (p.isDefault) return p;
            return {...p, [field]: value};
        }
        return p;
    }));

    if (field === 'name') {
        const selectedPersonality = personalities.find(p => p.id === selectedPersonalityId);
        if (selectedPersonality && !selectedPersonality.isDefault) {
            setBotName(value);
        }
    }
  };

  const handleSelectPersonality = (id: string) => {
    setSelectedPersonalityId(id);
    const selectedPersonality = personalities.find(p => p.id === id);
    if (selectedPersonality) {
        setBotName(selectedPersonality.name);
        addLog({ service: 'System', level: 'info', message: `User changed active bot personality to: ${selectedPersonality.name}` });
    }
  };
  
  const handleAddNewPersonality = () => {
    const newId = `personality-${Date.now()}`;
    const newPersonality: BotPersonalityType = { id: newId, name: 'New Bot', prompt: 'You are a helpful assistant.'};
    const newPersonalities = [...personalities, newPersonality];
    setPersonalities(newPersonalities);
    setSelectedPersonalityId(newId);
    setBotName(newPersonality.name);
    addLog({ service: 'System', level: 'info', message: `User created a new bot personality: ${newPersonality.name}` });
  };
  
  const handleDeletePersonality = () => {
    const personalityToDelete = personalities.find(p => p.id === selectedPersonalityId);
    if (!personalityToDelete || personalityToDelete.isDefault) {
        toast({title: "Cannot Delete", description: "The default COSMO personality cannot be deleted.", variant: "destructive"});
        return;
    }
    if (personalities.length <= 1) {
        toast({title: "Cannot Delete", description: "You must have at least one personality.", variant: "destructive"});
        return;
    }
    const newPersonalities = personalities.filter(p => p.id !== selectedPersonalityId);
    setPersonalities(newPersonalities);
    const newSelectedId = newPersonalities[0].id;
    setSelectedPersonalityId(newSelectedId);
    setBotName(newPersonalities[0].name);
    addLog({ service: 'System', level: 'warn', message: `User deleted bot personality: ${personalityToDelete.name}` });
  };

  const handleShareToStore = () => {
    const personalityToExport = personalities.find(p => p.id === selectedPersonalityId);
    if (!personalityToExport || personalityToExport.isDefault) {
        toast({ title: "Share Failed", description: "You can only share custom personalities.", variant: "destructive" });
        return;
    }

    const { id, isDefault, ...exportableData } = personalityToExport;
    
    const currentStore = JSON.parse(localStorage.getItem(BOT_STORE_KEY) || '[]');
    // Avoid duplicates
    if (currentStore.some((p: any) => p.name === exportableData.name)) {
         toast({ title: "Already Shared", description: `A personality named '${exportableData.name}' already exists in the store.`, variant: "destructive" });
         return;
    }

    const newStore = [...currentStore, exportableData];
    localStorage.setItem(BOT_STORE_KEY, JSON.stringify(newStore));
    setBotStore(newStore);

    toast({ title: "Personality Shared", description: `${exportableData.name} is now available in the Bot Store for other users.` });
    addLog({ service: 'System', level: 'info', message: `User shared personality to store: ${exportableData.name}` });
  };


  const handleImportFromStore = (name: string) => {
    const botToImport = botStore.find(p => p.name === name);
    if (!botToImport) return;

    if (personalities.some(p => p.name === botToImport.name)) {
        toast({ title: "Already exists", description: `You already have a personality named '${botToImport.name}'.`, variant: "destructive" });
        return;
    }

    const newPersonality: BotPersonalityType = {
      id: `imported-${Date.now()}`,
      name: botToImport.name,
      prompt: botToImport.prompt,
    };

    setPersonalities(prev => [...prev, newPersonality]);
    toast({ title: "Import Successful", description: `${newPersonality.name} has been added to your personalities.` });
    addLog({ service: 'System', level: 'info', message: `User imported personality: ${newPersonality.name}` });
  };
  
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('botPersonalities', JSON.stringify(personalities));
      if(selectedPersonalityId) {
          localStorage.setItem('selectedPersonalityId', selectedPersonalityId);
      }
      
      const currentPersonality = personalities.find(p => p.id === selectedPersonalityId);
      if (currentPersonality) {
        localStorage.setItem('botPersonalityPrompt', currentPersonality.prompt);
        localStorage.setItem('botName', currentPersonality.name);
      }

      toast({
        title: "Personalities Saved",
        description: "Your bot personalities have been updated.",
      });
      addLog({ service: 'System', level: 'info', message: 'Bot personalities saved by user.' });
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error("Failed to save personality settings", error);
      toast({
        title: "Save Failed",
        description: "Could not save personality. Your browser might be blocking local storage.",
        variant: "destructive",
      });
      addLog({ service: 'System', level: 'error', message: 'Failed to save personality settings.', details: error instanceof Error ? error.stack : String(error) });
    }
  };
  
  const selectedPersonality = personalities.find(p => p.id === selectedPersonalityId);
  const isSelectedPersonalityDefault = selectedPersonality?.isDefault === true;

  return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 flex-grow">
               {dragHandleProps && (
                <Button variant="ghost" size="icon" {...dragHandleProps} className="cursor-grab">
                  <GripVertical />
                </Button>
              )}
              <div className='flex-grow'>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Smile className="h-6 w-6 text-accent" />
                  Bot Personality
                </CardTitle>
                <CardDescription>Customize your AI assistant's name and behavior.</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isPoppedOut && onHide && (
                 <Button variant="ghost" size="icon" onClick={onHide}>
                  <EyeOff className="h-4 w-4" />
                </Button>
              )}
              {!isPoppedOut && onPopOut && <PopOutButton onClick={onPopOut} />}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col">
          <form id="bot-personality-form" className="space-y-4 flex-grow flex flex-col" onSubmit={handleSaveChanges}>
            <div className="space-y-2">
                <Label>Active Personality</Label>
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
                    <Button type="button" variant="outline" size="icon" onClick={handleAddNewPersonality} title="Add New Personality"><PlusCircle className="h-4 w-4"/></Button>
                    <Button type="button" variant="destructive" size="icon" onClick={handleDeletePersonality} disabled={isSelectedPersonalityDefault} title="Delete Personality"><Trash2 className="h-4 w-4"/></Button>
                </div>
            </div>

            {selectedPersonality && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="bot-name">Bot Name</Label>
                        <Input 
                            id="bot-name" 
                            type="text" 
                            placeholder="e.g., Station AI" 
                            value={selectedPersonality?.name || ''} 
                            onChange={(e) => handlePersonalityChange('name', e.target.value)} 
                            disabled={isSelectedPersonalityDefault}
                        />
                    </div>
                    <div className="space-y-2 flex-grow flex flex-col">
                        <Label htmlFor="bot-prompt">System Prompt</Label>
                        <Textarea 
                            id="bot-prompt" 
                            placeholder="You are a helpful assistant." 
                            value={selectedPersonality?.prompt || ''} 
                            onChange={(e) => handlePersonalityChange('prompt', e.target.value)} 
                            className="flex-grow"
                            disabled={isSelectedPersonalityDefault}
                        />
                        <p className="text-xs text-muted-foreground">This is the core instruction that defines your bot's behavior.</p>
                    </div>
                </>
            )}

            <Separator />
            
            <div className="space-y-2">
                <Label>Bot Store</Label>
                 <div className="flex items-center gap-2">
                     <Select onValueChange={handleImportFromStore}>
                        <SelectTrigger>
                            <div className="flex items-center gap-2">
                                <Store className="h-4 w-4" />
                                <SelectValue placeholder="Import from store..."/>
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                           {botStore.length > 0 ? (
                             botStore.map(p => (
                                <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                            ))
                           ) : (
                            <div className="p-2 text-sm text-muted-foreground">Store is empty.</div>
                           )}
                        </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" onClick={handleShareToStore} disabled={isSelectedPersonalityDefault}>
                        <Upload className="mr-2 h-4 w-4"/> Share Active Bot
                    </Button>
                </div>
            </div>


             <div className="flex justify-end items-center pt-4 border-t mt-auto">
                <Button type="submit" form="bot-personality-form">
                  <Save className="mr-2 h-4 w-4" />
                  Save All
                </Button>
            </div>
          </form>
        </CardContent>
      </Card>
  );
}
