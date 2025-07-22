
"use client";

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PopOutButton } from './pop-out-button';
import { FileAudio, GripVertical, EyeOff, Wand2, Loader2, Mic } from 'lucide-react';
import { useLogs } from '@/context/LogContext';
import { useToast } from '@/hooks/use-toast';
import { getTranscription } from '@/services/ai';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { ScrollArea } from '../ui/scroll-area';

interface AudioTranscriptionProps {
    onPopOut?: () => void;
    isPoppedOut?: boolean;
    onHide?: () => void;
    dragHandleProps?: any;
    isPreview?: boolean;
}

export function AudioTranscription({ onPopOut, isPoppedOut = false, onHide, dragHandleProps, isPreview }: AudioTranscriptionProps) {
    const { addLog } = useLogs();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [resultText, setResultText] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleTranscribe = async () => {
        if (!audioFile) {
            toast({ title: 'No File Selected', description: 'Please select an audio file to transcribe.', variant: 'destructive' });
            return;
        }

        setIsLoading(true);
        setResultText('');
        addLog({ service: 'Transcription', level: 'info', message: `Transcribing audio file: ${audioFile.name}` });

        try {
            const provider = localStorage.getItem('sttProvider') || 'openai';
            const { response, logs } = await getTranscription({ file: audioFile, provider, language: 'en' });
            setResultText(response.text);
            logs.forEach(log => addLog(log));
            toast({ title: 'Transcription Complete', description: 'Audio file successfully transcribed.' });
        } catch (e) {
            const err = e as Error;
            toast({ title: "Transcription Error", description: err.message, variant: 'destructive' });
            addLog({ service: 'Transcription', level: 'error', message: 'Failed to transcribe audio.', details: err.stack });
        } finally {
            setIsLoading(false);
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
                                <FileAudio className="h-6 w-6" />
                                Audio Transcription
                            </CardTitle>
                            <CardDescription>
                                Convert speech from an audio file into text.
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
                <div className="flex items-center justify-center w-full">
                    <Label htmlFor="audio-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <FileAudio className="w-8 h-8 mb-4 text-muted-foreground"/>
                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-muted-foreground">Audio File (MP3, WAV, etc.)</p>
                        </div>
                        <Input id="audio-file" type="file" className="hidden" ref={fileInputRef} onChange={e => setAudioFile(e.target.files?.[0] || null)} accept="audio/*" />
                    </Label>
                </div> 
                {audioFile && <p className="text-sm text-center text-muted-foreground">Selected: {audioFile.name}</p>}

                <div className="flex-grow">
                    {resultText && (
                        <Alert>
                            <Mic className="h-4 w-4" />
                            <AlertTitle>Transcription Result</AlertTitle>
                            <ScrollArea className="h-32 mt-2">
                                <AlertDescription>{resultText}</AlertDescription>
                            </ScrollArea>
                        </Alert>
                    )}
                </div>

                <div className="mt-auto">
                    <Button onClick={handleTranscribe} disabled={isLoading || !audioFile} className="w-full">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4" />}
                        Transcribe Audio
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
