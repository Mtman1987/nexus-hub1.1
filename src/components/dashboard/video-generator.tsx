
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wand2, GripVertical, EyeOff, Video, Settings, ChevronDown, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PopOutButton } from './pop-out-button';
import { useLogs } from '@/context/LogContext';
import { generateVideo } from '@/services/ai';
import type { VideoGeneratorOutput, VideoGeneratorInput } from '@/ai/types';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Slider } from '../ui/slider';

interface VideoGeneratorProps {
  onPopOut?: () => void;
  isPoppedOut?: boolean;
  onHide?: () => void;
  dragHandleProps?: any;
  isPreview?: boolean;
}

export function VideoGenerator({ onPopOut, isPoppedOut = false, onHide, dragHandleProps, isPreview }: VideoGeneratorProps) {
    const [prompt, setPrompt] = useState('A majestic dragon soaring over a mystical forest at dawn.');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<VideoGeneratorOutput | null>(null);
    const { toast } = useToast();
    const { addLog } = useLogs();

    const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">('16:9');
    const [durationSeconds, setDurationSeconds] = useState(5);

    const handleGenerateVideo = async () => {
        setIsLoading(true);
        setResult(null);

        const logDetails = `Prompt: "${prompt.substring(0, 100)}...", Aspect Ratio: ${aspectRatio}, Duration: ${durationSeconds}s`;
        addLog({ service: 'Video Generator', level: 'info', message: "User requested a video.", details: logDetails });
        
        try {
            const apiKey = localStorage.getItem('googleApiKey');
            if (!apiKey) {
                 toast({
                    title: "Missing Google AI Key",
                    description: "Please enter your Google AI API key in the API Vault.",
                    variant: "destructive"
                });
                addLog({ service: 'System', level: 'error', message: "Video Generator failed: Google AI API key is missing." });
                setIsLoading(false);
                return;
            }
            
            const input: VideoGeneratorInput = {
                prompt,
                aspectRatio,
                durationSeconds
            };

            const response = await generateVideo(input);
            setResult(response);
            response.logs.forEach(log => addLog(log));
            toast({ title: "Video Generation Complete", description: "Your video has been successfully generated."});

        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            toast({
                title: "Video Generation Failed",
                description: errorMessage,
                variant: "destructive"
            });
            addLog({ service: 'Video Generator', level: 'error', message: `Video generation failed: ${errorMessage}`, details: error instanceof Error ? error.stack : String(error) });
        } finally {
            setIsLoading(false);
        }
    }

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
                  <Video className="h-6 w-6" />
                  Avatar Forge
                </CardTitle>
                <CardDescription>
                  Generate animated avatars from text prompts.
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
                    <p>Forging avatar...</p>
                    <p className="text-xs">This can take up to a minute.</p>
                </div>
            ) : result?.video?.url ? (
                <video
                    src={result.video.url}
                    controls
                    autoPlay
                    loop
                    className="max-w-full max-h-full rounded-md"
                >
                    Your browser does not support the video tag.
                </video>
            ) : (
                <div className="text-center text-muted-foreground">
                    <Video className="h-12 w-12 mx-auto mb-2" />
                    <p>Your generated avatar will appear here.</p>
                </div>
            )}
        </div>
        
        <div className="space-y-4 mt-auto shrink-0">
            <Textarea 
                id="prompt" 
                placeholder="Enter a prompt, e.g., 'Close up of a friendly robot, cinematic lighting'" 
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
                            <h4 className="font-medium leading-none">Video Options</h4>
                            <p className="text-sm text-muted-foreground">
                            Configure the generation parameters.
                            </p>
                        </div>
                        <div className="grid gap-4">
                            <div className="grid grid-cols-3 items-center gap-4">
                                <Label htmlFor="aspectRatio">Aspect Ratio</Label>
                                <Select value={aspectRatio} onValueChange={(v: "16:9" | "9:16") => setAspectRatio(v)}>
                                    <SelectTrigger className="col-span-2"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                                        <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-3 items-center gap-4">
                                <Label htmlFor="duration">Duration</Label>
                                <div className="col-span-2 flex items-center gap-2">
                                     <Slider
                                        id="duration"
                                        min={5} max={8} step={1}
                                        value={[durationSeconds]}
                                        onValueChange={(v) => setDurationSeconds(v[0])}
                                    />
                                    <span className="text-xs font-mono">{durationSeconds}s</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

             <Button onClick={handleGenerateVideo} disabled={isLoading || !prompt} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Forge Avatar
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
