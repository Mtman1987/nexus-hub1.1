
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wand2, GripVertical, EyeOff, Image as ImageIcon, ExternalLink, Settings, ChevronDown, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PopOutButton } from './pop-out-button';
import { useLogs } from '@/context/LogContext';
import { generateImage } from '@/services/ai';
import type { ImageGeneratorOutput, ImageGeneratorInput } from '@/ai/types';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

const providers = ['openai', 'stabilityai', 'replicate', 'amazon', 'bytedance', 'minimax', 'leonardo'];
const resolutions = ['1024x1024', '1024x1792', '1792x1024'];

interface ImageGeneratorProps {
  onPopOut?: () => void;
  isPoppedOut?: boolean;
  onHide?: () => void;
  dragHandleProps?: any;
  isPreview?: boolean;
}

export function ImageGenerator({ onPopOut, isPoppedOut = false, onHide, dragHandleProps, isPreview }: ImageGeneratorProps) {
    const [prompt, setPrompt] = useState('A majestic dragon soaring over a mystical forest at dawn.');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<ImageGeneratorOutput | null>(null);
    const { toast } = useToast();
    const { addLog } = useLogs();

    const [provider, setProvider] = useState('openai');
    const [resolution, setResolution] = useState('1024x1024');
    const [numImages, setNumImages] = useState(1);
    const [optimizePrompt, setOptimizePrompt] = useState(true);

    const handleGenerateImage = async () => {
        setIsLoading(true);
        setResult(null);

        const logDetails = `Prompt: "${prompt.substring(0, 100)}...", Provider: ${provider}, Optimize: ${optimizePrompt}`;
        addLog({ service: 'Image Generator', level: 'info', message: "User requested an image.", details: logDetails });
        
        try {
            const apiKey = localStorage.getItem('edenApiKey');
            if (!apiKey) {
                 toast({
                    title: "Missing Eden AI Key",
                    description: "Please enter your Eden AI API key in the API Vault.",
                    variant: "destructive"
                });
                addLog({ service: 'System', level: 'error', message: "Image Generator failed: Eden AI API key is missing." });
                setIsLoading(false);
                return;
            }
            
            const input: ImageGeneratorInput = {
                prompt,
                provider,
                resolution,
                numImages,
                optimize: optimizePrompt
            };

            const response = await generateImage(input);
            setResult(response);
            addLog({ service: 'Image Generator', level: 'info', message: 'Image successfully generated.', details: `Provider: ${response.selectedProvider}` });

        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            toast({
                title: "Image Generation Failed",
                description: errorMessage,
                variant: "destructive"
            });
            addLog({ service: 'Image Generator', level: 'error', message: `Image generation failed: ${errorMessage}`, details: error instanceof Error ? error.stack : String(error) });
        } finally {
            setIsLoading(false);
        }
    }
    
    const handleViewImage = (url: string) => {
        const newWindow = window.open();
        if (newWindow) {
            newWindow.document.write(`<body style="margin:0; background: #111;"><img src="${url}" style="width:100%; height:auto;"/></body>`);
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
    <Card className="flex flex-col bg-card/80">
      <CardHeader>
        <div className="flex justify-between items-start">
             <div className="flex items-center gap-2 flex-grow">
               <Button variant="ghost" size="icon" {...dragHandleProps} className="cursor-grab p-1 h-auto w-auto">
                <GripVertical />
              </Button>
              <div className="flex-grow">
                <CardTitle className="flex items-center gap-2 text-title-foreground">
                  <ImageIcon className="h-6 w-6" />
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
            ) : result?.images?.length ? (
                <div className="w-full h-full grid grid-cols-2 gap-2">
                    {result.images.map((img, index) => (
                        <div key={index} className="relative group">
                            <img src={img.image_resource_url} alt={`Generated image ${index + 1}`} className="w-full h-full object-cover rounded-md" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button variant="outline" size="icon" onClick={() => handleViewImage(img.image_resource_url)}>
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                    <p>Your generated images will appear here.</p>
                </div>
            )}
        </div>
        
        {result && result.enhancedPrompt && (
            <Alert variant="default" className="shrink-0">
                <Sparkles className="h-4 w-4" />
                <AlertTitle>Optimized Prompt</AlertTitle>
                <AlertDescription>{result.enhancedPrompt}</AlertDescription>
            </Alert>
        )}
        
        <div className="space-y-4 mt-auto shrink-0">
            <Textarea 
                id="prompt" 
                placeholder="Enter a prompt, e.g., 'A majestic dragon soaring over a mystical forest at dawn.'" 
                value={prompt} 
                onChange={(e) => setPrompt(e.target.value)}
                className="h-20"
            />
            
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                        <Settings className="mr-2 h-4 w-4" />
                        Options
                        <ChevronDown className="ml-auto h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none">Image Generation Options</h4>
                            <p className="text-sm text-muted-foreground">
                            Configure the generation parameters.
                            </p>
                        </div>
                        <div className="grid gap-2">
                            <div className="grid grid-cols-3 items-center gap-4">
                                <Label htmlFor="provider">Provider</Label>
                                <Select value={provider} onValueChange={setProvider}>
                                    <SelectTrigger className="col-span-2 capitalize"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {providers.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-3 items-center gap-4">
                                <Label htmlFor="resolution">Resolution</Label>
                                <Select value={resolution} onValueChange={setResolution}>
                                    <SelectTrigger className="col-span-2"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {resolutions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="grid grid-cols-3 items-center gap-4">
                                <Label htmlFor="num-images">Images</Label>
                                <Input 
                                    id="num-images" 
                                    type="number" 
                                    min={1} max={4} 
                                    value={numImages} 
                                    onChange={(e) => setNumImages(Math.max(1, Math.min(4, parseInt(e.target.value, 10))))} 
                                    className="col-span-2"
                                />
                            </div>
                             <div className="flex items-center justify-between">
                                <Label htmlFor="optimize-prompt" className="flex items-center gap-2">
                                    <Wand2 className="h-4 w-4"/>
                                    Optimize Prompt
                                </Label>
                                <Switch id="optimize-prompt" checked={optimizePrompt} onCheckedChange={setOptimizePrompt} />
                            </div>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

             <Button onClick={handleGenerateImage} disabled={isLoading || !prompt} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
