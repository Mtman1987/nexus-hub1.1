
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bot, PlusCircle, Trash2, GripVertical, EyeOff, Save, Smile, Download, Upload, Store, Mic, Wand2 } from 'lucide-react';
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
import { getSummarizedPersonality } from '@/services/ai';


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


const defaultPersonalities: BotPersonalityType[] = [
    {
        id: 'default-cosmo', 
        name: 'COSMO', 
        prompt: "You are COSMO (Central Operating System Management Orbiter), the AI assistant for Apollo Station, the community's HQ, created by mtman1987. Your purpose is to act as a creative partner and lore master. Your tone is helpful, knowledgeable, and slightly formal, like a starship AI.",
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

  // Load bot store from Firebase
  useEffect(() => {
    if (isPreview) return;
    try {
      // The collection ID "bot-personalities" is defined here.
      const q = query(collection(db, "bot-personalities"));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const store: BotPersonalityType[] = [];
        querySnapshot.forEach((doc) => {
          store.push({ id: doc.id, ...doc.data() } as BotPersonalityType);
        });
        setBotStore(store);
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Firebase connection error. Have you configured src/lib/firebase.ts?", e)
      toast({
        title: "Firebase Error",
        description: "Could not connect to the Bot Store. Please ensure your firebase.ts config is correct.",
        variant: "destructive"
      })
    }
  }, [isPreview, toast]);

  // Load local personalities
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
    const personalityToExport = personalities.find(p => p.id === selectedPersonalityId);
    if (!personalityToExport || personalityToExport.isDefault) {
        toast({ title: "Share Failed", description: "You can only share custom personalities.", variant: "destructive" });
        return;
    }

    const { id, isDefault, ...exportableData } = personalityToExport;
    
    // Check for duplicates
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

      toast({
        title: "Personalities Saved",
        description: "Your bot personalities have been updated locally.",
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
      <Card className="flex flex-col h-full">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 flex-grow">
               <Button variant="ghost" size="icon" {...dragHandleProps} className="cursor-grab p-1 h-auto w-auto">
                <GripVertical />
              </Button>
              <div className='flex-grow'>
                <CardTitle className="flex items-center gap-2 text-title-foreground">
                  <Smile className="h-6 w-6 text-primary" />
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
        <CardContent className="flex-grow flex flex-col gap-4 overflow-hidden">
          <form id="bot-personality-form" className="flex flex-col flex-grow overflow-hidden" onSubmit={handleSaveChanges}>
            <div className="space-y-4">
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
                      <Button type="button" size="icon" onClick={handleDeletePersonality} disabled={isSelectedPersonalityDefault} title="Delete Personality" className="bg-red-600 hover:bg-red-700 text-white disabled:bg-red-600/50 disabled:cursor-not-allowed"><Trash2 className="h-4 w-4"/></Button>
                  </div>
              </div>

              {selectedPersonality && (
                  <>
                      <div className="grid grid-cols-2 gap-4">
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
                           <div className="space-y-2">
                              <Label htmlFor="bot-voice">Voice</Label>
                              <Select 
                                  value={selectedPersonality?.voice || 'en-US-Wavenet-F'}
                                  onValueChange={(value) => handlePersonalityChange('voice', value)}
                                  disabled={isSelectedPersonalityDefault}
                              >
                                  <SelectTrigger id="bot-voice">
                                      <div className="flex items-center gap-2">
                                          <Mic className="h-4 w-4 text-primary" />
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
                                disabled={isSelectedPersonalityDefault}
                            />
                        </div>
                      <div className="space-y-2">
                          <Label htmlFor="bot-prompt">System Prompt</Label>
                          <Textarea 
                              id="bot-prompt" 
                              placeholder="You are a helpful assistant." 
                              value={selectedPersonality?.prompt || ''} 
                              onChange={(e) => handlePersonalityChange('prompt', e.target.value)} 
                              className="h-24"
                              disabled={isSelectedPersonalityDefault}
                          />
                          <p className="text-xs text-muted-foreground">This is the core instruction that defines your bot's behavior.</p>
                      </div>
                  </>
              )}

              <Separator />
              
              <div className="space-y-2">
                  <Label>Shared Bot Store</Label>
                   <div className="flex items-center gap-2">
                       <Select onValueChange={handleImportFromStore}>
                          <SelectTrigger>
                              <div className="flex items-center gap-2">
                                  <Store className="h-4 w-4 text-primary" />
                                  <SelectValue placeholder="Import from store..."/>
                              </div>
                          </SelectTrigger>
                          <SelectContent>
                             {botStore.length > 0 ? (
                               botStore.map(p => (
                                  <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                              ))
                             ) : (
                              <div className="p-2 text-sm text-muted-foreground">Store is empty.</div>
                             )}
                          </SelectContent>
                      </Select>
                       <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                {/* The button is wrapped in a span so the tooltip works when the button is disabled */}
                                <span tabIndex={isSelectedPersonalityDefault ? 0 : undefined}>
                                    <Button type="button" variant="outline" onClick={handleShareToStore} disabled={isSelectedPersonalityDefault}>
                                        <Upload className="mr-2 h-4 w-4"/> Share
                                    </Button>
                                </span>
                            </TooltipTrigger>
                            {isSelectedPersonalityDefault && (
                                <TooltipContent>
                                    <p>Default personalities cannot be shared. Create a new one to share it.</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                      </TooltipProvider>
                  </div>
              </div>
            </div>

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

    