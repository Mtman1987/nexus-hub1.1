
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
import { MessageSquare, Send, Loader2, Bot, User, Radio, Globe, Link } from 'lucide-react';
import DiscordLogo from '@/components/icons/discord-logo';
import { Twitch } from 'lucide-react';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLogs, type LogEntry } from '@/context/LogContext';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { PopOutButton } from './pop-out-button';


const formSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty.'),
  targets: z.array(z.string()),
});

type Message = {
  sender: 'user' | 'ai';
  text: string;
  targets?: string[];
  nexusConnectTargets?: string[];
};

interface UnifiedChatProps {
  isPoppedOut?: boolean;
  onPopOut?: () => void;
}

export const UnifiedChat = forwardRef<HTMLInputElement, UnifiedChatProps>(({ isPoppedOut = false, onPopOut }, ref) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
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
  }, [])

  const getFormTargets = useCallback(() => form.getValues('targets'), [form]);

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
      sender: 'user',
      text: values.message,
      targets: values.targets,
      ...(values.targets.includes('Nexus Connect') && { nexusConnectTargets: selectedNexusTargets })
    };
    setMessages((prev) => [...prev, userMessage]);
    form.reset({ message: '', targets: values.targets });

    setLoading(false);
    addLog({ service: 'System', level: 'warn', message: 'Chat is disabled because Genkit was removed.' });
    toast({
        title: "Feature Disabled",
        description: "This AI feature is currently disabled.",
        variant: "destructive",
    });

    const aiErrorResponse: Message = {
        sender: 'ai',
        text: `I'm sorry, I couldn't process your request. The AI features are currently disabled.`
    }
    setMessages(prev => [...prev, aiErrorResponse]);

  }, [addLog, form, toast, selectedNexusTargets]);


  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth',
        });
    }
  }, [messages]);

  useEffect(() => {
    const channel = new BroadcastChannel('nexus-hub-chat');

    const handleMessage = (event: MessageEvent) => {
        const data = event.data;
        if (['discord-message', 'streamerbot-message', 'nexus-connect-message'].includes(data.type)) {
            const relayedMessage: Message = {
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
  }, [addLog, getFormTargets, performSubmit]);


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
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div className="flex-grow">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-accent" />
                Unified Chat
              </CardTitle>
              <CardDescription>
                Send messages to AI, Discord, Twitch, and other services.
              </CardDescription>
            </div>
            {!isPoppedOut && onPopOut && <PopOutButton onClick={onPopOut} />}
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col overflow-hidden">
        <ScrollArea className="flex-grow bg-muted/20 rounded-lg p-4 mb-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chat history will be displayed here.</p>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                  {msg.sender === 'ai' && <Bot className="h-6 w-6 text-accent" />}
                  <div className={`rounded-lg p-3 text-sm ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
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
          <form onSubmit={form.handleSubmit(performSubmit)} className="space-y-4">
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
