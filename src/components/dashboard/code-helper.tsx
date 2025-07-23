
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Wand2, GripVertical, EyeOff, Code, Copy, Terminal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PopOutButton } from './pop-out-button';
import { useLogs } from '@/context/LogContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '../ui/label';
import { getCodeGeneration } from '@/services/ai';
import type { CodeGeneratorInput, CodeGeneratorOutput } from '@/ai/types';

const languages = ['Python', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'SQL', 'Java', 'C#', 'Go', 'Rust'];

interface CodeHelperProps {
  onPopOut?: () => void;
  isPoppedOut?: boolean;
  onHide?: () => void;
  dragHandleProps?: any;
  isPreview?: boolean;
}

export function CodeHelper({ onPopOut, isPoppedOut = false, onHide, dragHandleProps, isPreview }: CodeHelperProps) {
    const [instruction, setInstruction] = useState('Write a python function that calculates fibonacci');
    const [language, setLanguage] = useState('Python');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<CodeGeneratorOutput | null>(null);
    const { toast } = useToast();
    const { addLog } = useLogs();

    const handleGenerateCode = async () => {
        setIsLoading(true);
        setResult(null);

        const logDetails = `Instruction: "${instruction.substring(0, 100)}...", Language: ${language}`;
        addLog({ service: 'Cipher', level: 'info', message: "User requested code generation.", details: logDetails });

        try {
            const config: { [key: string]: any } = {};
            const configKeys = ['edenApiKey', 'edenAiProvider', 'edenAiModel'];
            configKeys.forEach(key => {
                const item = localStorage.getItem(key);
                if (item) {
                    try {
                        config[key] = JSON.parse(item);
                    } catch {
                        config[key] = item;
                    }
                }
            });

            if (!config.edenApiKey) {
                toast({
                    title: "Missing Primary API Key",
                    description: "Please enter your Eden AI API key in the API Vault.",
                    variant: "destructive"
                });
                addLog({ service: 'System', level: 'error', message: "Cipher failed: Primary Eden AI API key is missing." });
                setIsLoading(false);
                return;
            }

            const input: CodeGeneratorInput = {
                instruction,
                language,
                config,
            };

            const { response, logs } = await getCodeGeneration(input);
            setResult(response);
            logs.forEach(log => addLog(log));

        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            setResult({
                generated_code: `// Error: The AI returned an error.\n// ${errorMessage}`,
            });
            toast({
                title: "Generation Failed",
                description: "An unexpected error occurred. Check the Captain's Log for details.",
                variant: "destructive"
            });
            addLog({ service: 'System', level: 'error', message: `Cipher failed: ${errorMessage}`, details: error instanceof Error ? error.stack : String(error) });
        } finally {
            setIsLoading(false);
        }
    }
    
    const copyToClipboard = () => {
        if (!result?.generated_code) return;
        navigator.clipboard.writeText(result.generated_code).then(() => {
            toast({ title: "Code Copied", description: "The generated code has been copied to your clipboard." });
        }).catch(err => {
             toast({ title: "Copy Failed", description: "Could not copy code to clipboard.", variant: "destructive" });
        });
    };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
             <div className="flex items-center gap-2 flex-grow">
               <Button variant="ghost" size="icon" {...dragHandleProps} className="cursor-grab p-1 h-auto w-auto text-accent">
                <GripVertical />
              </Button>
              <div className="flex-grow">
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-6 w-6" />
                  Cipher (Code Helper)
                </CardTitle>
                <CardDescription>
                  Generate code snippets from natural language instructions.
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
        <div className="space-y-2 shrink-0">
            <Label htmlFor="instruction">Instruction</Label>
            <Textarea 
                id="instruction" 
                placeholder="e.g., 'Create a React component for a login form'" 
                value={instruction} 
                onChange={(e) => setInstruction(e.target.value)}
                className="h-24"
            />
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

        <div className="flex-grow overflow-y-auto pr-1">
          {isLoading ? (
             <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
             </div>
          ) : result && (
              <div className="relative mt-2">
                 <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4" />
                 </Button>
                 <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    <code className={`language-${language.toLowerCase()}`}>
                       {result.generated_code}
                    </code>
                 </pre>
              </div>
          )}
        </div>

        <div className="flex justify-end mt-auto pt-4 border-t">
            <Button onClick={handleGenerateCode} disabled={isLoading || !instruction}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Generate Code
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
