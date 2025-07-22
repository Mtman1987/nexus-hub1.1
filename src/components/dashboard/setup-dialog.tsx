
"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Wand2, Sparkles, Loader2, ShieldCheck } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getSetupAssistantResponse } from '@/services/ai';
import type { SetupAssistantInput, SetupAssistantOutput } from '@/ai/types';
import { useToast } from '@/hooks/use-toast';
import { useLogs } from '@/context/LogContext';

interface SetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const steps = [
  {
    title: "Secure Your Vault",
    description: "Create a password to protect your API keys. You will need this to make changes later.",
    isGroup: true,
    required: true,
    topic: "Vault Password"
  },
  {
    title: "Eden AI API Key (Required)",
    description: "This is the primary key for COSMO and other AI tools.",
    field: "edenApiKey",
    required: true,
    topic: "Eden AI"
  },
  {
    title: "Google AI API Key (Optional)",
    description: "This key provides a fallback for the main chat and can power other AI tools.",
    field: "googleApiKey",
    required: false,
    topic: "Google AI"
  },
  {
    title: "Discord Configuration (Optional)",
    description: "Provide a Bot Token for bot actions and a Webhook for channel messages.",
    isGroup: true,
    topic: "Discord"
  },
  {
    title: "Twitch Configuration (Optional)",
    description: "Provide a Bot Token for chat and a Webhook for notifications.",
    isGroup: true,
    topic: "Twitch"
  },
  {
    title: "Streamer.bot (Optional)",
    description: "Enter the address and port for your local Streamer.bot WebSocket server. This should usually be 127.0.0.1.",
    isGroup: true,
    topic: "Streamer.bot"
  },
];

type ApiKeys = { [key: string]: string };

export function SetupDialog({ open, onOpenChange }: SetupDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [aiIsLoading, setAiIsLoading] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResult, setAiResult] = useState<SetupAssistantOutput | null>(null);
  const { toast } = useToast();
  const { addLog } = useLogs();

  const progress = ((currentStep + 1) / (steps.length + 1)) * 100;

  const handleFinish = () => {
    try {
      Object.entries(apiKeys).forEach(([key, value]) => {
        if (value) {
          localStorage.setItem(key, value);
        }
      });
      // Set a default model so the app works out of the box
      localStorage.setItem('edenAiModel', 'openai/gpt-4o');
      localStorage.setItem('vaultPassword', password);

      toast({
        title: "Configuration Saved",
        description: "Your initial settings have been saved. You can change them later in the API Key Vault.",
      });
      window.dispatchEvent(new Event('storage')); // Notify other components of changes
      window.location.reload(); // Reload to apply all settings
    } catch (error) {
      console.error("Failed to save settings from wizard", error);
      toast({
        title: "Save Failed",
        description: "Could not save settings. Your browser might be blocking local storage.",
        variant: "destructive",
      });
    } finally {
        onOpenChange(false);
    }
  };


  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };
  
  const handleSkip = () => {
    if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [field]: value }));
  };
  
  const handleAiHelp = async () => {
    if (!aiQuestion.trim()) return;
    setAiIsLoading(true);
    setAiResult(null);

    try {
        // We provide a temporary config for the AI helper call.
        // The flow itself forces the use of a specific cost-effective model.
        const tempConfigForAI = { 
            edenApiKey: apiKeys.edenApiKey,
            // Provide a default model for the call structure, even though the flow overrides it.
            edenAiModel: 'google/gemini-1.5-flash-latest',
        };
        const input: SetupAssistantInput = {
            topic: steps[currentStep].topic,
            question: aiQuestion,
            config: tempConfigForAI
        };
        const { response, logs } = await getSetupAssistantResponse(input);
        setAiResult(response);
        logs.forEach(log => addLog(log));

    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
        setAiResult({ answer: `Sorry, there was an error: ${errorMessage}` });
        toast({
            title: "COSMO Error",
            description: "Could not get a response from COSMO. Check your primary Eden AI key if provided.",
            variant: "destructive",
        });
        addLog({ service: 'System', level: 'error', message: `Setup Assistant failed: ${errorMessage}` });
    } finally {
        setAiIsLoading(false);
    }
}

  const stepConfig = steps[currentStep];
  const isAssistantDisabled = !apiKeys.edenApiKey;
  
  let isNextDisabled = false;
  if (stepConfig.required) {
    if (currentStep === 0) { // Password step
        isNextDisabled = !password || password !== confirmPassword;
    } else if (stepConfig.field) {
        isNextDisabled = !apiKeys[stepConfig.field];
    }
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl">Apollo Station Onboarding</DialogTitle>
          <DialogDescription>
            Let's get your services configured. Follow the steps below.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
            <Progress value={progress} className="w-full" />

            <div className="space-y-2">
                <h3 className="font-semibold text-lg">{stepConfig.title}</h3>
                <p className="text-sm text-muted-foreground">{stepConfig.description}</p>
            </div>
            
            {!stepConfig.isGroup ? (
                <Input
                    type="password"
                    placeholder={`Enter your ${stepConfig.title}...`}
                    value={apiKeys[stepConfig.field as string] || ''}
                    onChange={(e) => handleInputChange(stepConfig.field as string, e.target.value)}
                />
            ) : (
                <>
                {currentStep === 0 && (
                     <div className="space-y-4 p-4 border rounded-lg bg-background">
                         <div className="space-y-2">
                             <Label htmlFor="vault-password">New Password</Label>
                             <Input id="vault-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                         </div>
                         <div className="space-y-2">
                             <Label htmlFor="confirm-password">Confirm Password</Label>
                             <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                         </div>
                         {password && confirmPassword && password !== confirmPassword && (
                            <Alert variant="destructive">
                                <ShieldCheck className="h-4 w-4" />
                                <AlertTitle>Passwords do not match!</AlertTitle>
                            </Alert>
                         )}
                     </div>
                )}
                {currentStep === 3 && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="discord-token">Discord Bot Token</Label>
                            <Input id="discord-token" type="password" placeholder="Bot token for Discord" value={apiKeys.discordToken || ''} onChange={(e) => handleInputChange('discordToken', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="discord-webhook">Discord Webhook URL</Label>
                            <Input id="discord-webhook" type="text" placeholder="Webhook URL for a Discord channel" value={apiKeys.discordWebhook || ''} onChange={(e) => handleInputChange('discordWebhook', e.target.value)} />
                        </div>
                    </div>
                )}
                {currentStep === 4 && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="twitch-token">Twitch Bot Token</Label>
                            <Input id="twitch-token" type="password" placeholder="Bot token for Twitch chat" value={apiKeys.twitchToken || ''} onChange={(e) => handleInputChange('twitchToken', e.target.value)} />
                        </div>
                    </div>
                )}
                {currentStep === 5 && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="streamerbot-address">Streamer.bot Server Address</Label>
                            <Input id="streamerbot-address" type="text" placeholder="e.g., 127.0.0.1" value={apiKeys.streamerbotServerAddress || ''} onChange={(e) => handleInputChange('streamerbotServerAddress', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="streamerbot-port">Streamer.bot Server Port</Label>
                            <Input id="streamerbot-port" type="text" placeholder="e.g., 8080" value={apiKeys.streamerbotServerPort || ''} onChange={(e) => handleInputChange('streamerbotServerPort', e.target.value)} />
                        </div>
                    </div>
                )}
                </>
            )}
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger disabled={isAssistantDisabled}>
                    <div className="flex items-center gap-2 text-sm">
                        <Wand2 className="h-4 w-4" />
                        {isAssistantDisabled ? "Enter Eden AI key to enable COSMO" : "Need help from COSMO?"}
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="space-y-4 pt-2">
                       <div className="space-y-2">
                         <Label htmlFor="ai-question">Ask COSMO</Label>
                         <div className="flex items-center gap-2">
                            <Input id="ai-question" placeholder={`e.g., "How do I get a ${stepConfig.topic} key?"`} value={aiQuestion} onChange={e => setAiQuestion(e.target.value)} />
                            <Button onClick={handleAiHelp} disabled={aiIsLoading} size="icon">
                                {aiIsLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4"/>}
                            </Button>
                         </div>
                       </div>
                       {aiResult && (
                           <Alert variant="default">
                               <Terminal className="h-4 w-4" />
                               <AlertTitle>COSMO Says:</AlertTitle>
                               <AlertDescription>
                                   {aiResult.answer}
                               </AlertDescription>
                           </Alert>
                       )}
                    </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

        </div>

        <DialogFooter>
            {!stepConfig.required && (
                <Button variant="ghost" onClick={handleSkip}>Skip</Button>
            )}
            <Button onClick={handleNext} disabled={isNextDisabled}>
                {currentStep === steps.length - 1 ? 'Finish Setup' : 'Next'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
