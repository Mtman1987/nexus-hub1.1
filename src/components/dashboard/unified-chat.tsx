
"use client";

import { useState, forwardRef, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { MessageSquare, Send, Loader2, Bot, User, Radio, Globe, Link, Save, GripVertical, EyeOff, Volume2, Play } from 'lucide-react';
import DiscordLogo from '@/components/icons/discord-logo';
import { Twitch } from 'lucide-react';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { unifiedChat } from '@/services/ai';
import type { UnifiedChatInput } from '@/ai/types';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLogs, type LogEntry } from '@/context/LogContext';
import { PopOutButton } from './pop-out-button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { getTTSAudio } from '@/services/ai';


const formSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty.'),
  targets: z.array(z.string()),
});

type Message = {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  targets?: string[];
  nexusConnectTargets?: string[];
  audioData?: string;
};

interface UnifiedChatProps {
  onPopOut?: () => void;
  isPoppedOut?: boolean;
  onHide?: () => void;
  dragHandleProps?: any;
  isPreview?: boolean;
}

export const UnifiedChat = forwardRef<HTMLInputElement, UnifiedChatProps>(({ onPopOut, isPoppedOut = false, onHide, dragHandleProps, isPreview }, ref) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState<string | null>(null);
  const { toast } = useToast();
  const { addLog } = useLogs();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const [nexusConnections, setNexusConnections] = useState<string[]>([]);
  const [selectedNexusTargets, setSelectedNexusTargets] = useState<string[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: '',
      targets: ['AI Bot'],
    },
  });
  
  useEffect(() => {
    if (isPreview) return;
    try {
        const savedConnections = localStorage.getItem('nexusConnectConnections');
        if(savedConnections) {
            setNexusConnections(JSON.parse(savedConnections));
        }
    } catch (e) {
        console.error("Failed to load Nexus Connections", e);
    }
    // Listen for storage changes to keep connections updated
    const handleStorageChange = (e: StorageEvent) => {
        if(e.key === 'nexusConnectConnections') {
            setNexusConnections(JSON.parse(e.newValue || '[]'));
        }
    }
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isPreview]);

  const getFormTargets = useCallback(() => form.getValues('targets'), [form]);

  const handleSaveMessage = (message: Message) => {
    try {
        const savedItems = JSON.parse(localStorage.getItem('apollo-station-saved-items') || '[]');
        const newItem = {
            id: `chat-${Date.now()}`,
            type: 'chat',
            content: { sender: message.sender, text: message.text },
            savedAt: new Date().toISOString(),
        };

        const newItems = [newItem, ...savedItems];
        localStorage.setItem('apollo-station-saved-items', JSON.stringify(newItems));
        toast({
            title: "Message Saved",
            description: "The chat message has been saved to your Saved Items.",
        });
        window.dispatchEvent(new Event('storage')); // Notify other components
    } catch(e) {
        toast({
            title: "Save Failed",
            description: "Could not save message to local storage.",
            variant: "destructive"
        });
    }
  };


  const performSubmit = useCallback(async (values: z.infer<typeof formSchema>) => {
    if (!values.message.trim() || values.targets.length === 0) return;

    setLoading(true);
    addLog({ 
      service: 'System', 
      level: 'info', 
      message: `User sent message from Unified Chat to: ${values.targets.join(', ')}`,
      details: `Message content: "${values.message}"`
    });

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: values.message,
      targets: values.targets,
      ...(values.targets.includes('Nexus Connect') && { nexusConnectTargets: selectedNexusTargets })
    };
    setMessages((prev) => [...prev, userMessage]);
    form.reset({ message: '', targets: values.targets });

    try {
      const allConfig: { [key: string]: any | null } = {};
      const configKeys = [
        'discordWebhook', 'streamerbotServerAddress', 'streamerbotServerPort', 
        'streamerbotRequestType', 'streamerbotActionName', 'streamerbotVariableName',
        'edenApiKey', 'googleApiKey', 'openaiApiKey', 'groqApiKey',
        'edenAiModelName', 'googleModelName', 'openaiModelName', 'groqModelName',
        'providerStatus', 'fallbackStrategy', 'botPersonalityPrompt', 'botName', 'botVoice',
        'remoteHubAddress', 'remoteAccessSecret'
      ];
      configKeys.forEach(key => {
        const item = localStorage.getItem(key);
        if (key === 'providerStatus' || key === 'fallbackStrategy') {
            allConfig[key] = item ? JSON.parse(item) : null;
        } else {
            allConfig[key] = item;
        }
      });

      const input: UnifiedChatInput = {
        message: values.message,
        targets: values.targets,
        config: allConfig,
        nexusConnectTargets: selectedNexusTargets
      };

      const response = await unifiedChat(input);
      response.logs.forEach(log => addLog(log as Omit<LogEntry, 'timestamp'>));
      
      if (response.websiteAction) {
          if (response.websiteAction.action === 'youtube_search') {
            const webChannel = new BroadcastChannel('apollo-station-website-control');
            webChannel.postMessage({ action: 'youtube_search', query: response.websiteAction.payload });
            webChannel.close();
          } else if (response.websiteAction.action === 'add_youtube_song') {
            const musicChannel = new BroadcastChannel('apollo-station-music-player');
            musicChannel.postMessage({ action: 'add_youtube_song', payload: response.websiteAction.payload });
            musicChannel.close();
          }
      }

      if (response.reply) {
        const aiMessage: Message = {
            id: `msg-${Date.now() + 1}`,
            sender: 'ai',
            text: response.reply,
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      const errorDetails = error instanceof Error ? error.stack : JSON.stringify(error);
      
      addLog({ 
        service: 'System', 
        level: 'error', 
        message: `Unified Chat submission failed: ${errorMessage}`,
        details: errorDetails
      });
      
      toast({
        title: "Message Failed",
        description: "An error occurred while sending the message. Check logs for details.",
        variant: "destructive",
      });

      const aiErrorResponse: Message = {
          id: `msg-${Date.now() + 1}`,
          sender: 'ai',
          text: `I'm sorry, I couldn't process your request. The following error occurred: ${errorMessage}`
      }
      setMessages(prev => [...prev, aiErrorResponse]);

    } finally {
      setLoading(false);
    }
  }, [addLog, form, toast, selectedNexusTargets]);

  const handlePlayAudio = async (messageId: string, text: string) => {
      setLoadingAudio(messageId);
      try {
        const voice = localStorage.getItem('botVoice') || 'Algenib';
        const { media } = await getTTSAudio({ text, voice });
        
        setMessages(prev => prev.map(msg => 
            msg.id === messageId ? {...msg, audioData: media} : msg
        ));
        
        const audio = new Audio(media);
        audio.play();

      } catch (e) {
        const err = e as Error;
        toast({ title: "Audio Error", description: err.message, variant: 'destructive' });
        addLog({ service: 'TTS', level: 'error', message: 'Failed to generate or play audio.', details: err.stack });
      } finally {
        setLoadingAudio(null);
      }
  };


  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth',
        });
    }
  }, [messages]);

  useEffect(() => {
    if (isPreview) return;
    const channel = new BroadcastChannel('apollo-station-chat');

    const handleMessage = (event: MessageEvent) => {
        const data = event.data;
        if (['discord-message', 'streamerbot-message', 'nexus-connect-message'].includes(data.type)) {
            const relayedMessage: Message = {
              id: `msg-${Date.now()}`,
              sender: 'user',
              text: data.text,
              targets: data.targets
            };
            setMessages((prev) => [...prev, relayedMessage]);
            addLog({
                service: data.type.replace('-message',''),
                level: 'info',
                message: `Received relayed message: ${data.text}`
            });

            const currentTargets = getFormTargets();
            if(currentTargets.includes('AI Bot')) {
                performSubmit({ message: data.text, targets: ['AI Bot'] });
            }
        }
    };

    channel.addEventListener('message', handleMessage);
    addLog({ service: 'System', level: 'info', message: 'Unified Chat BroadcastChannel listener attached.' });

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
      addLog({ service: 'System', level: 'info', message: 'Unified Chat BroadcastChannel listener detached.' });
    };
  }, [addLog, getFormTargets, performSubmit, isPreview]);


  const targetOptions = [
    { id: 'AI Bot', icon: <Bot className="h-4 w-4" /> },
    { id: 'Discord', icon: <DiscordLogo className="h-4 w-4" /> },
    { id: 'Twitch', icon: <Twitch className="h-4 w-4" /> },
    { id: 'Streamer.bot', icon: <Radio className="h-4 w-4" /> },
    { id: 'Website', icon: <Globe className="h-4 w-4" /> },
  ];

  const handleNexusTargetSelect = (url: string) => {
    setSelectedNexusTargets(prev => 
        prev.includes(url) ? prev.filter(t => t !== url) : [...prev, url]
    );
  };
  
  const isNexusConnectChecked = form.watch('targets').includes('Nexus Connect');

  return (
    <Card className="flex flex-col bg-card/80" style={{ height: '480px' }}>
      <CardHeader>
        <div className="flex justify-between items-start">
             <div className="flex items-center gap-2 flex-grow">
               <Button variant="ghost" size="icon" {...dragHandleProps} className="cursor-grab p-1 h-auto w-auto">
                <GripVertical />
              </Button>
              <div className="flex-grow">
                <CardTitle className="flex items-center gap-2 text-title-foreground">
                  <MessageSquare className="h-6 w-6 text-accent" />
                  Unified Chat
                </CardTitle>
                <CardDescription>
                  Send messages to AI, Discord, Twitch, and other services.
                </CardDescription>
              </div>
            </div>
             <div className="flex items-center">
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
        <ScrollArea className="flex-grow bg-muted/20 rounded-lg p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chat history will be displayed here.</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`group flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                  {msg.sender === 'ai' && (
                    <div className="flex flex-col gap-1 items-center">
                        <Bot className="h-6 w-6 text-accent flex-shrink-0" />
                        {loadingAudio === msg.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                           <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handlePlayAudio(msg.id, msg.text)}>
                             <Play className="h-4 w-4"/>
                           </Button>
                        )}
                    </div>
                  )}
                  <div className={`relative rounded-lg p-3 text-sm ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                    <Button variant="ghost" size="icon" className="absolute -top-2 -left-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 hover:bg-background" onClick={() => handleSaveMessage(msg)}>
                       <Save className="h-3 w-3" />
                    </Button>
                    <p>{msg.text}</p>
                    {msg.sender === 'user' && msg.targets && (
                      <div className="flex items-center flex-wrap gap-x-2 mt-2 text-xs text-primary-foreground/80">
                        <span>Sent to:</span>
                        {msg.targets.map(t => <span key={t} className="font-semibold">{t}</span>)}
                        {msg.nexusConnectTargets && msg.nexusConnectTargets.length > 0 && (
                            <span className="font-semibold">{msg.nexusConnectTargets.length} Nexus User(s)</span>
                        )}
                      </div>
                    )}
                  </div>
                   {msg.sender === 'user' && <User className="h-6 w-6" />}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(performSubmit)} className="space-y-4 mt-auto">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input ref={ref} placeholder="Type your message..." className="flex-grow" {...field} />
                      <Button type="submit" disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="targets"
              render={({ field }) => (
                <FormItem className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  {targetOptions.map((item) => (
                      <FormItem key={item.id} className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            id={item.id.toLowerCase().replace(/[^a-z0-9]/g, '')}
                            checked={field.value?.includes(item.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...(field.value || []), item.id])
                                : field.onChange(
                                  (field.value || []).filter(
                                    (value) => value !== item.id
                                  )
                                )
                            }}
                          />
                        </FormControl>
                        <Label htmlFor={item.id.toLowerCase().replace(/[^a-z0-9]/g, '')} className="flex items-center gap-1.5 cursor-pointer">
                          {item.icon}
                          {item.id}
                        </Label>
                      </FormItem>
                  ))}
                  
                  {/* Nexus Connect Dropdown Checkbox */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                         <div className="flex items-center space-x-2">
                            <Checkbox
                                id="nexus-connect-trigger"
                                checked={isNexusConnectChecked}
                                onCheckedChange={(checked) => {
                                    const currentTargets = field.value || [];
                                    const newTargets = checked 
                                        ? [...currentTargets, 'Nexus Connect'] 
                                        : currentTargets.filter(t => t !== 'Nexus Connect');
                                    field.onChange(newTargets);
                                    if(!checked) {
                                        setSelectedNexusTargets([]); // Clear selections if unchecked
                                    }
                                }}
                            />
                            <Label htmlFor="nexus-connect-trigger" className="flex items-center gap-1.5 cursor-pointer">
                                <Link className="h-4 w-4" />
                                Nexus Connect {selectedNexusTargets.length > 0 && `(${selectedNexusTargets.length})`}
                            </Label>
                         </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className={cn(!isNexusConnectChecked && "hidden")}>
                        <DropdownMenuLabel>Select Nexus Contacts</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {nexusConnections.length > 0 ? (
                           nexusConnections.map((conn, index) => (
                            <DropdownMenuCheckboxItem
                                key={index}
                                checked={selectedNexusTargets.includes(conn)}
                                onCheckedChange={() => handleNexusTargetSelect(conn)}
                                onSelect={(e) => e.preventDefault()} // Prevent menu from closing on item click
                            >
                                {`Contact ${index + 1}`}
                            </DropdownMenuCheckboxItem>
                           ))
                        ) : (
                            <DropdownMenuLabel className="text-muted-foreground font-normal">No contacts saved in API Vault.</DropdownMenuLabel>
                        )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
});

UnifiedChat.displayName = 'UnifiedChat';

    