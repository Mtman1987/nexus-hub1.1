
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wand2, GripVertical, EyeOff, Image as ImageIcon, Save, Info, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PopOutButton } from './pop-out-button';
import { useLogs } from '@/context/LogContext';
import { imageGeneratorFlow } from '@/ai/flows/image-generator-flow';
import type { ImageGeneratorOutput } from '@/ai/types';
import Image from 'next/image';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface ImageGeneratorProps {
  onPopOut?: () => void;
  isPoppedOut?: boolean;
  onHide?: () => void;
  dragHandleProps?: any;
}

export function ImageGenerator({ onPopOut, isPoppedOut = false, onHide, dragHandleProps }: ImageGeneratorProps) {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<ImageGeneratorOutput | null>(null);
    const { toast } = useToast();
    const { addLog } = useLogs();

    const handleGenerateImage = async () => {
        setIsLoading(true);
        setResult(null);

        const logDetails = `Initial Prompt: "${prompt.substring(0, 100)}..."`;
        addLog({ service: 'Image Generator', level: 'info', message: "User requested an image.", details: logDetails });
        
        try {
            const apiKey = localStorage.getItem('googleApiKey');
            if (!apiKey) {
                 toast({
                    title: "Missing Google API Key",
                    description: "Please enter your Google API key in the API Vault. The Image Generator uses a Google model.",
                    variant: "destructive"
                });
                addLog({ service: 'System', level: 'error', message: "Image Generator failed: Google API key is missing." });
                setIsLoading(false);
                return;
            }

            const response = await imageGeneratorFlow({ prompt });
            setResult(response);
            addLog({ service: 'Image Generator', level: 'info', message: 'Image successfully generated.', details: `Enhanced Prompt: ${response.enhancedPrompt}` });

        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            toast({
                title: "Image Generation Failed",
                description: "An unexpected error occurred. Check the Captain's Log for details.",
                variant: "destructive"
            });
            addLog({ service: 'Image Generator', level: 'error', message: `Image generation failed: ${errorMessage}`, details: error instanceof Error ? error.stack : String(error) });
        } finally {
            setIsLoading(false);
        }
    }
    
    const handleViewImage = () => {
        if (!result) return;
        const newWindow = window.open();
        if (newWindow) {
            newWindow.document.write(`<body style="margin:0; background: #111;"><img src="${result.imageUrl}" style="width:100%; height:auto;"/></body>`);
            newWindow.document.title = "Stargate Imagery";
        } else {
            toast({
                title: "Could not open window",
                description: "Please allow pop-ups for this site.",
                variant: "destructive"
            });
        }
    };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
             <div className="flex items-center gap-2 flex-grow">
               <Button variant="ghost" size="icon" {...dragHandleProps} className="cursor-grab p-1 h-auto w-auto">
                <GripVertical />
              </Button>
              <div className="flex-grow">
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-6 w-6 text-accent" />
                  Stargate Imagery
                </CardTitle>
                <CardDescription>
                  Generate images from a text prompt via AI.
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
        <div className="flex-grow flex flex-col items-center justify-center bg-muted/50 rounded-lg p-4 relative overflow-y-auto">
            {isLoading ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin"/>
                    <p>Generating image...</p>
                    <p className="text-xs">This may take a moment.</p>
                </div>
            ) : result?.imageUrl ? (
                <div className="w-full space-y-2">
                    <Label htmlFor="image-url">Image URL (Data URI)</Label>
                    <div className="flex gap-2">
                         <Input id="image-url" readOnly value={result.imageUrl} className="text-xs" />
                         <Button variant="outline" size="icon" onClick={handleViewImage}>
                            <ExternalLink className="h-4 w-4" />
                         </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Click the button to view the full-size image in a new window.</p>
                </div>
            ) : (
                <div className="text-center text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                    <p>Your generated image URL will appear here.</p>
                </div>
            )}
        </div>
        
        {result && (
             <Alert variant="default" className="text-xs shrink-0">
                <Info className="h-4 w-4" />
                <AlertTitle>Enhanced Prompt Used</AlertTitle>
                <AlertDescription>
                    {result.enhancedPrompt}
                </AlertDescription>
            </Alert>
        )}

        <div className="space-y-2 mt-auto shrink-0">
            <Textarea 
                id="prompt" 
                placeholder="Enter a prompt, e.g., 'A majestic dragon soaring over a mystical forest at dawn.'" 
                value={prompt} 
                onChange={(e) => setPrompt(e.target.value)}
                className="h-20"
            />
             <Button onClick={handleGenerateImage} disabled={isLoading || !prompt} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Generate
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
