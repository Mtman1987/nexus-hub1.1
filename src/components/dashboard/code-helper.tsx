
"use client";

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Wand2, GripVertical, EyeOff, Code, Copy, Terminal, User, Bot, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PopOutButton } from './pop-out-button';
import { useLogs } from '@/context/LogContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '../ui/label';
import { getCodeGeneration } from '@/services/ai';
import type { CodeGeneratorInput, CodeGeneratorOutput } from '@/ai/types';
import { cn } from '@/lib/utils';

const languages = ['Python', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'SQL', 'Java', 'C#', 'Go', 'Rust'];

type Message = {
    sender: 'user' | 'ai';
    text: string;
}

interface CodeHelperProps {
  onPopOut?: () => void;
  isPoppedOut?: boolean;
  onHide?: () => void;
  dragHandleProps?: any;
  isPreview?: boolean;
}

export function CodeHelper({ onPopOut, isPoppedOut = false, onHide, dragHandleProps, isPreview }: CodeHelperProps) {
    const [instruction, setInstruction] = useState('');
    const [language, setLanguage] = useState('Python');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const { toast } = useToast();
    const { addLog } = useLogs();
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const handleSendMessage = async () => {
        if (!instruction.trim()) return;

        setIsLoading(true);
        const userMessage: Message = { sender: 'user', text: instruction };
        setMessages(prev => [...prev, userMessage]);
        setInstruction('');

        const logDetails = `Instruction: "${instruction.substring(0, 100)}...", Language: ${language}`;
        addLog({ service: 'Cipher', level: 'info', message: "User sent message to Cipher.", details: logDetails });

        try {
            const config: { [key: string]: any } = {};
            const configKeys = ['edenApiKey', 'edenAiProvider', 'edenAiModel'];
            configKeys.forEach(key => {
                const item = localStorage.getItem(key);
                if (item) config[key] = item;
            });

            if (!config.edenApiKey) {
                toast({
                    title: "Missing Primary API Key",
                    description: "Please enter your Eden AI API key in the API Vault.",
                    variant: "destructive"
                });
                setIsLoading(false);
                return;
            }

            const history = messages.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                text: msg.text
            }));

            const input: CodeGeneratorInput = {
                instruction,
                language,
                config,
                history,
            };

            const { response, logs } = await getCodeGeneration(input);
            logs.forEach(log => addLog(log));

            const aiMessage: Message = { sender: 'ai', text: response.explanation };
            setMessages(prev => [...prev, aiMessage]);
            
            if (response.code) {
                setGeneratedCode(response.code);
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            const aiErrorMessage: Message = { sender: 'ai', text: `An error occurred: ${errorMessage}` };
            setMessages(prev => [...prev, aiErrorMessage]);
            toast({
                title: "Generation Failed",
                description: "Check the Captain's Log for details.",
                variant: "destructive"
            });
            addLog({ service: 'System', level: 'error', message: `Cipher failed: ${errorMessage}`, details: error instanceof Error ? error.stack : String(error) });
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);
    
    const copyToClipboard = () => {
        if (!generatedCode) return;
        navigator.clipboard.writeText(generatedCode).then(() => {
            toast({ title: "Code Copied", description: "The generated code has been copied to your clipboard." });
        }).catch(err => {
             toast({ title: "Copy Failed", description: "Could not copy code to clipboard.", variant: "destructive" });
        });
    };

  return (
    <Card className="flex flex-col h-full bg-secondary/20">
      <CardHeader>
        <div className="flex justify-between items-start">
             <div className="flex items-center gap-2 flex-grow">
               <Button variant="ghost" size="icon" {...dragHandleProps} className="cursor-grab p-1 h-auto w-auto text-accent">
                <GripVertical />
              </Button>
              <div className="flex-grow">
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-6 w-6 text-primary" />
                  Cipher (Code Helper)
                </CardTitle>
                <CardDescription>
                  Collaborate with the AI to generate code snippets.
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center">
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
        <div className="space-y-2 shrink-0">
            <Label htmlFor="language">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="language">
                    <SelectValue placeholder="Select a language..." />
                </SelectTrigger>
                <SelectContent>
                    {languages.map(lang => (
                        <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

        <ScrollArea className="flex-grow bg-muted/20 rounded-lg p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
                {messages.length === 0 ? (
                    <p className="text-sm text-center text-muted-foreground">Chat history will appear here.</p>
                ) : (
                    messages.map((msg, index) => (
                        <div key={index} className={cn("flex items-start gap-3", msg.sender === 'user' ? 'justify-end' : '')}>
                            {msg.sender === 'ai' && <Bot className="h-6 w-6 shrink-0 text-primary" />}
                            <div className={cn("rounded-lg p-3 text-sm max-w-sm", msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary')}>
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                            </div>
                            {msg.sender === 'user' && <User className="h-6 w-6 shrink-0" />}
                        </div>
                    ))
                )}
                 {isLoading && (
                    <div className="flex items-start gap-3">
                        <Bot className="h-6 w-6 shrink-0 text-primary" />
                        <div className="rounded-lg p-3 text-sm bg-secondary flex items-center gap-2">
                           <Loader2 className="h-4 w-4 animate-spin" />
                           <span>Cipher is thinking...</span>
                        </div>
                    </div>
                 )}
            </div>
        </ScrollArea>

        <div className="mt-4 space-y-2">
            <Label>Send Message</Label>
            <div className="flex items-center gap-2">
                <Textarea 
                    id="instruction" 
                    placeholder="e.g., 'Create a React component for a login form'" 
                    value={instruction} 
                    onChange={(e) => setInstruction(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                    className="h-12 resize-none"
                />
                 <Button onClick={handleSendMessage} disabled={isLoading || !instruction} size="icon" className="h-12 w-12 shrink-0">
                    <Send className="h-5 w-5" />
                 </Button>
            </div>
        </div>

         {generatedCode && (
              <div className="relative mt-2">
                 <Label>Generated Code</Label>
                 <Button variant="ghost" size="icon" className="absolute top-8 right-2 h-7 w-7" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4" />
                 </Button>
                 <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm mt-2">
                    <code className={`language-${language.toLowerCase()}`}>
                       {generatedCode}
                    </code>
                 </pre>
              </div>
          )}
      </CardContent>
    </Card>
  );
}
