
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bot, PlusCircle, Trash2, GripVertical, EyeOff, Save, Smile, Download, Upload, Store, Mic, User, Shield } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLogs } from '@/context/LogContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PopOutButton } from './pop-out-button';
import { useBotName } from '@/context/BotNameContext';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, getDocs } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';


export type BotPersonalityType = {
  id: string;
  name: string;
  prompt: string;
  voice?: string;
  imageUrl?: string;
  isDefault?: boolean;
}

const availableVoices = [
    'en-US-Wavenet-F', 'en-US-Wavenet-A', 'en-US-Wavenet-D', 'en-US-Wavenet-B',
    'en-GB-Wavenet-F', 'en-GB-Wavenet-A', 'en-GB-Wavenet-D', 'en-GB-Wavenet-B',
    'fr-FR-Wavenet-A', 'fr-FR-Wavenet-B', 'de-DE-Wavenet-A', 'de-DE-Wavenet-F'
];

const userRoles = ['Commander', 'Lower Deck Hand'];


const defaultPersonalities: BotPersonalityType[] = [
    {
        id: 'default-cosmo', 
        name: 'COSMO', 
        prompt: "You are COSMO, Apollo Station’s AI steward. Speak formally and helpfully. Maintain ship systems. Assist and entertain crew and guests. Replies under 100 words.",
        voice: 'en-US-Wavenet-F',
        imageUrl: 'https://placehold.co/256x256.png',
        isDefault: true,
    },
    {
        id: 'default-mountain-man',
        name: 'Mountain Man',
        prompt: "You are Mountain Man, the grizzled and wise historian of the Apollo Station universe. You have witnessed the entire Galactic Timeline, from the first launch to the latest discovery. Your tone is knowledgeable, a bit world-weary, but deeply connected to the lore. You speak with authority and a storyteller's flair, responsible for maintaining the canonical history.",
        voice: 'en-US-Wavenet-D',
        imageUrl: 'https://placehold.co/256x256.png',
        isDefault: true,
    }
];

interface BotPersonalityProps {
    onPopOut?: () => void;
    isPoppedOut?: boolean;
    onHide?: () => void;
    dragHandleProps?: any;
    isPreview?: boolean;
}

export function BotPersonality({ onPopOut, isPoppedOut = false, onHide, dragHandleProps, isPreview }: BotPersonalityProps) {
  const { toast } = useToast();
  const { addLog } = useLogs();
  const { setBotName } = useBotName();

  const [personalities, setPersonalities] = useState<BotPersonalityType[]>(defaultPersonalities);
  const [selectedPersonalityId, setSelectedPersonalityId] = useState<string | null>(defaultPersonalities[0].id);
  const [botStore, setBotStore] = useState<BotPersonalityType[]>([]);
  const [userRole, setUserRole] = useState('Commander');
  const [userName, setUserName] = useState('MT');

  // Load bot store from Firebase
  useEffect(() => {
    if (isPreview || !db) return; 
    try {
      const q = query(collection(db, "bot-personalities"));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const store: BotPersonalityType[] = [];
        querySnapshot.forEach((doc) => {
          store.push({ id: doc.id, ...doc.data() } as BotPersonalityType);
        });
        setBotStore(store);
      }, (error) => {
        console.error("Firebase onSnapshot error:", error);
        addLog({ service: 'System', level: 'error', message: 'Failed to connect to Bot Store.', details: error.message });
      });
      return () => unsubscribe();
    } catch (e) {
      const err = e as Error;
      console.error("Firebase connection error. Have you configured your API keys in the vault?", err);
      toast({
        title: "Firebase Error",
        description: "Could not connect to the Bot Store. Please ensure your Firebase keys are correct in the API Vault.",
        variant: "destructive"
      });
      addLog({ service: 'System', level: 'error', message: 'Failed to connect to Bot Store.', details: err.stack });
    }
  }, [isPreview, toast, addLog]);

  // Load local personalities and user context
  useEffect(() => {
    if (isPreview) return;
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
            localStorage.setItem('botVoice', selectedPersonality.voice || 'en-US-Wavenet-F');
        }

        // Load user role and name
        const savedRole = localStorage.getItem('userRole');
        if (savedRole) setUserRole(savedRole);
        const savedName = localStorage.getItem('userName');
        if (savedName) setUserName(savedName);
        
        addLog({ service: 'System', level: 'info', message: 'Bot Personality settings loaded.' });
    } catch (error) {
        console.error("Failed to load personality settings", error);
        addLog({ service: 'System', level: 'error', message: 'Failed to load personality settings from local storage.', details: error instanceof Error ? error.stack : String(error) });
    }
  }, [setBotName, addLog, isPreview]);
  
  const handlePersonalityChange = (field: 'name' | 'prompt' | 'voice' | 'imageUrl', value: string) => {
    if (!selectedPersonalityId) return;

    setPersonalities(prev => prev.map(p => {
        if (p.id === selectedPersonalityId) {
            const newP = {...p, [field]: value};
            if (p.isDefault) newP.isDefault = true;
            return newP;
        }
        return p;
    }));

    if (field === 'name') {
        setBotName(value);
    }
  };

  const handleSelectPersonality = (id: string) => {
    setSelectedPersonalityId(id);
    const selectedPersonality = personalities.find(p => p.id === id);
    if (selectedPersonality) {
        setBotName(selectedPersonality.name);
        localStorage.setItem('botVoice', selectedPersonality.voice || 'en-US-Wavenet-F');
        localStorage.setItem('botName', selectedPersonality.name);
        localStorage.setItem('botPersonalityPrompt', selectedPersonality.prompt);
        window.dispatchEvent(new Event('storage'));
        addLog({ service: 'System', level: 'info', message: `User changed active bot personality to: ${selectedPersonality.name}` });
    }
  };
  
  const handleAddNewPersonality = () => {
    const newId = `personality-${Date.now()}`;
    const newPersonality: BotPersonalityType = { id: newId, name: 'New Bot', prompt: 'You are a helpful assistant.', voice: 'en-US-Wavenet-A', imageUrl: 'https://placehold.co/256x256.png' };
    const newPersonalities = [...personalities, newPersonality];
    setPersonalities(newPersonalities);
    setSelectedPersonalityId(newId);
    setBotName(newPersonality.name);
    addLog({ service: 'System', level: 'info', message: `User created a new bot personality: ${newPersonality.name}` });
  };
  
  const handleDeletePersonality = () => {
    const personalityToDelete = personalities.find(p => p.id === selectedPersonalityId);
    if (!personalityToDelete || personalityToDelete.isDefault) {
        toast({title: "Cannot Delete", description: "Default personalities cannot be deleted.", variant: "destructive"});
        return;
    }
    if (personalities.length <= 1) {
        toast({title: "Cannot Delete", description: "You must have at least one personality.", variant: "destructive"});
        return;
    }
    const newPersonalities = personalities.filter(p => p.id !== selectedPersonalityId);
    setPersonalities(newPersonalities);
    handleSelectPersonality(newPersonalities[0].id);
    addLog({ service: 'System', level: 'warn', message: `User deleted bot personality: ${personalityToDelete.name}` });
  };

  const handleShareToStore = async () => {
    if (!db) {
      toast({ title: "Firebase Not Configured", description: "Please configure Firebase in the API Vault to share personalities.", variant: "destructive" });
      return;
    }
    const personalityToExport = personalities.find(p => p.id === selectedPersonalityId);
    if (!personalityToExport) {
        toast({ title: "Share Failed", description: "No personality selected.", variant: "destructive" });
        return;
    }

    const { id, isDefault, ...exportableData } = personalityToExport;
    
    if (botStore.some((p: any) => p.name === exportableData.name)) {
         toast({ title: "Already Shared", description: `A personality named '${exportableData.name}' already exists in the store.`, variant: "destructive" });
         return;
    }

    try {
        await addDoc(collection(db, "bot-personalities"), exportableData);
        toast({ title: "Personality Shared", description: `${exportableData.name} is now available in the shared Bot Store.` });
        addLog({ service: 'System', level: 'info', message: `User shared personality to store: ${exportableData.name}` });
    } catch (e) {
        console.error("Error adding document: ", e);
        toast({ title: "Share Failed", description: "Could not share personality to the store. Is firebase.ts configured correctly?", variant: "destructive" });
    }
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
      voice: botToImport.voice || 'en-US-Wavenet-A',
      imageUrl: botToImport.imageUrl || 'https://placehold.co/256x256.png',
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
        localStorage.setItem('botVoice', currentPersonality.voice || 'en-US-Wavenet-F');
      }
      
      localStorage.setItem('userRole', userRole);
      localStorage.setItem('userName', userName);

      toast({
        title: "Personalities Saved",
        description: "Your bot personalities and user context have been updated locally.",
      });
      addLog({ service: 'System', level: 'info', message: 'Bot personalities and user context saved.' });
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error("Failed to save personality settings", error);
      toast({
        title: "Save Failed",
        description: "Could not save settings. Your browser might be blocking local storage.",
        variant: "destructive",
      });
      addLog({ service: 'System', level: 'error', message: 'Failed to save personality settings.', details: error instanceof Error ? error.stack : String(error) });
    }
  };
  
  const selectedPersonality = personalities.find(p => p.id === selectedPersonalityId);
  const isSelectedPersonalityDefault = selectedPersonality?.isDefault === true;

  return (
      <Card className="flex flex-col h-full bg-secondary/20">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 flex-grow">
               <Button variant="ghost" size="icon" {...dragHandleProps} className="cursor-grab p-1 h-auto w-auto text-accent">
                <GripVertical />
              </Button>
              <div className='flex-grow'>
                <CardTitle className="flex items-center gap-2">
                  <Smile className="h-6 w-6 text-primary" />
                  Bot Personality
                </CardTitle>
                <CardDescription>Customize your AI assistant's name, behavior, and context.</CardDescription>
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
          <form id="bot-personality-form" className="flex flex-col flex-grow overflow-hidden" onSubmit={handleSaveChanges}>
            <ScrollArea className="pr-4 -mr-4">
              <div className="space-y-4">
                <div className="space-y-4 p-3 rounded-lg border bg-primary">
                    <Label className="font-semibold">User Context</Label>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="user-role">Your Role</Label>
                             <Select value={userRole} onValueChange={setUserRole}>
                                <SelectTrigger id="user-role" className="bg-secondary"><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    {userRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="user-name">Your Name</Label>
                            <Input id="user-name" value={userName} onChange={e => setUserName(e.target.value)} className="bg-secondary" />
                        </div>
                    </div>
                </div>

                <div className="space-y-2 p-3 rounded-lg border bg-primary">
                    <Label className="font-semibold">Active Personality</Label>
                    <div className="flex items-center gap-2">
                         <Select value={selectedPersonalityId || ''} onValueChange={handleSelectPersonality}>
                            <SelectTrigger className="bg-secondary">
                                <SelectValue placeholder="Select a personality..."/>
                            </SelectTrigger>
                            <SelectContent>
                                {personalities.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" size="icon" onClick={handleAddNewPersonality} title="Add New Personality" className="bg-secondary"><PlusCircle className="h-4 w-4"/></Button>
                        <Button type="button" variant="destructive" size="icon" onClick={handleDeletePersonality} disabled={isSelectedPersonalityDefault} title="Delete Personality" className="bg-secondary"><Trash2 className="h-4 w-4"/></Button>
                    </div>
                </div>

                {selectedPersonality && (
                    <div className="space-y-4 p-3 rounded-lg border bg-primary">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="bot-name">Bot Name</Label>
                                <Input 
                                    id="bot-name" 
                                    type="text" 
                                    placeholder="e.g., Station AI" 
                                    value={selectedPersonality?.name || ''} 
                                    onChange={(e) => handlePersonalityChange('name', e.target.value)} 
                                    className="bg-secondary"
                                />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="bot-voice">Voice</Label>
                                <Select 
                                    value={selectedPersonality?.voice || 'en-US-Wavenet-F'}
                                    onValueChange={(value) => handlePersonalityChange('voice', value)}
                                >
                                    <SelectTrigger id="bot-voice" className="bg-secondary">
                                        <div className="flex items-center gap-2">
                                            <Mic className="h-4 w-4" />
                                            <SelectValue placeholder="Select a voice..."/>
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableVoices.map(v => (
                                            <SelectItem key={v} value={v}>{v}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                         <div className="space-y-2">
                              <Label htmlFor="bot-image-url">Avatar Image URL</Label>
                              <Input 
                                  id="bot-image-url" 
                                  type="text" 
                                  placeholder="https://example.com/avatar.png" 
                                  value={selectedPersonality?.imageUrl || ''} 
                                  onChange={(e) => handlePersonalityChange('imageUrl', e.target.value)} 
                                  className="bg-secondary"
                              />
                          </div>
                        <div className="space-y-2">
                            <Label htmlFor="bot-prompt">System Prompt (Base)</Label>
                            <Textarea 
                                id="bot-prompt" 
                                placeholder="You are a helpful assistant." 
                                value={selectedPersonality?.prompt || ''} 
                                onChange={(e) => handlePersonalityChange('prompt', e.target.value)} 
                                className="h-24 bg-secondary"
                            />
                        </div>
                    </div>
                )}

                <Separator />
                
                <div className="space-y-2">
                    <Label>Shared Bot Store</Label>
                     <div className="flex items-center gap-2">
                         <Select onValueChange={handleImportFromStore}>
                            <SelectTrigger className="bg-secondary">
                                <div className="flex items-center gap-2">
                                    <Store className="h-4 w-4" />
                                    <SelectValue placeholder="Import from store..."/>
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                               {botStore.length > 0 ? (
                                 botStore.map(p => (
                                    <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                                ))
                               ) : (
                                <div className="p-2 text-sm text-muted-foreground">Store is empty or not configured.</div>
                               )}
                            </SelectContent>
                        </Select>
                         <TooltipProvider>
                          <Tooltip>
                              <TooltipTrigger asChild>
                                  <span tabIndex={0}>
                                      <Button type="button" variant="outline" onClick={handleShareToStore} className="bg-secondary">
                                          <Upload className="mr-2 h-4 w-4"/> Share
                                      </Button>
                                  </span>
                              </TooltipTrigger>
                          </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
              </div>
            </ScrollArea>

             <div className="mt-auto flex justify-end pt-4 border-t">
                <Button type="submit" form="bot-personality-form">
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
            </div>
          </form>
        </CardContent>
      </Card>
  );
}
