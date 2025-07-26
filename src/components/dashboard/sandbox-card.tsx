
"use client";

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PopOutButton } from './pop-out-button';
import { Beaker, GripVertical, EyeOff, Save, Loader2, Bot, User, Send, Copy } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Label } from '../ui/label';
import { saveToSandbox } from '@/ai/flows/save-to-sandbox-flow';
import { ScrollArea } from '../ui/scroll-area';
import { getCodeGeneration } from '@/services/ai';
import type { CodeGeneratorInput } from '@/ai/types';
import { cn } from '@/lib/utils';
import { useLogs } from '@/context/LogContext';
import { Input } from '../ui/input';

type Message = {
    sender: 'user' | 'ai';
    text: string;
};

interface SandboxCardProps {
    onPopOut?: () => void;
    isPoppedOut?: boolean;
    onHide?: () => void;
    dragHandleProps?: any;
    isPreview?: boolean;
}

export function SandboxCard({ onPopOut, isPoppedOut = false, onHide, dragHandleProps, isPreview }: SandboxCardProps) {
    const [instruction, setInstruction] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [fileName, setFileName] = useState('');
    const { toast } = useToast();
    const { addLog } = useLogs();
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const handleSendMessage = async () => {
        if (!instruction.trim()) return;

        setIsLoading(true);
        const userMessage: Message = { sender: 'user', text: instruction };
        setMessages(prev => [...prev, userMessage]);
        setInstruction('');

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
                language: 'TypeScript', // Or make this selectable
                config,
                history,
            };

            const { response, logs } = await getCodeGeneration(input);
            logs.forEach(addLog);

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
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    const handleSave = async () => {
        if (!generatedCode) {
            toast({ title: 'Nothing to Save', description: 'Please generate some code first.', variant: 'destructive' });
            return;
        }
        if (!fileName.trim()) {
            toast({ title: 'File Name Required', description: 'Please enter a file name.', variant: 'destructive' });
            return;
        }

        const finalFileName = fileName.endsWith('.tsx') ? fileName : `${fileName}.tsx`;
        
        setIsSaving(true);
        try {
            const result = await saveToSandbox({
                code: generatedCode,
                filePath: `src/components/sandbox/finished_code/${finalFileName}`
            });

            if (result.success) {
                toast({
                    title: 'Code Saved',
                    description: `Saved to finished_code/${finalFileName}`,
                });
                addLog({service: 'Sandbox', level: 'info', message: 'Successfully saved component to finished code folder.'})
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            const err = error as Error;
            toast({ title: 'Save Failed', description: err.message, variant: 'destructive' });
            addLog({service: 'Sandbox', level: 'error', message: 'Failed to save component.', details: err.stack});
        } finally {
            setIsSaving(false);
        }
    };

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
                                <Beaker className="h-6 w-6 text-primary" />
                                Cipher Sandbox
                            </CardTitle>
                            <CardDescription>
                                Chat with Cipher to generate components and save them.
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
                <ScrollArea className="flex-grow bg-muted/20 rounded-lg p-4 h-48" ref={scrollAreaRef}>
                    <div className="space-y-4">
                        {messages.length === 0 ? (
                            <p className="text-sm text-center text-muted-foreground">Chat with Cipher to generate a component.</p>
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

                <div className="space-y-2">
                    <Label>Send Message</Label>
                    <div className="flex items-center gap-2">
                        <Textarea 
                            id="instruction" 
                            placeholder="e.g., 'Create a React component...'" 
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
                    <div className="relative mt-2 flex-grow flex flex-col">
                        <Label>Generated Code</Label>
                        <div className="absolute top-0 right-2 z-10 flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyToClipboard}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                        <ScrollArea className="flex-grow mt-2">
                            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs h-full">
                                <code>
                                {generatedCode}
                                </code>
                            </pre>
                        </ScrollArea>
                        <div className="flex items-center gap-2 mt-4">
                            <Input 
                                placeholder="component-name.tsx" 
                                value={fileName}
                                onChange={e => setFileName(e.target.value)}
                            />
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                                Save to Finished Code
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
