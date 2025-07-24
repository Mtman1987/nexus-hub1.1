
"use client";

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PopOutButton } from './pop-out-button';
import { Languages, GripVertical, EyeOff, AudioLines, Mic, FileAudio, Play, Wand2, Loader2, ArrowRightLeft, Volume2, Copy } from 'lucide-react';
import { useLogs } from '@/context/LogContext';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from '../ui/textarea';
import { getTranslation, getTTSAudio, getTranscription } from '@/services/ai';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

const availableVoices = ['Algenib', 'Achernar', 'Spica', 'Sirius', 'Arcturus', 'Canopus', 'Vega', 'Rigel'];
const languages = {
    "en": "English", "es": "Spanish", "fr": "French", "de": "German", "it": "Italian",
    "pt": "Portuguese", "ru": "Russian", "ja": "Japanese", "ko": "Korean", "zh": "Chinese"
};

interface TranslatorProps {
    onPopOut?: () => void;
    isPoppedOut?: boolean;
    onHide?: () => void;
    dragHandleProps?: any;
    isPreview?: boolean;
}

export function Translator({ onPopOut, isPoppedOut = false, onHide, dragHandleProps, isPreview }: TranslatorProps) {
    const { addLog } = useLogs();
    const { toast } = useToast();
    
    // Shared State
    const [isLoading, setIsLoading] = useState(false);
    
    // Translation State
    const [translateText, setTranslateText] = useState('');
    const [sourceLang, setSourceLang] = useState('en');
    const [targetLang, setTargetLang] = useState('es');
    const [translatedText, setTranslatedText] = useState('');

    // TTS State
    const [ttsText, setTtsText] = useState('');
    const ttsAudioRef = useRef<HTMLAudioElement>(null);
    
    // STT State
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [transcribedText, setTranscribedText] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleTranslate = async () => {
        if (!translateText.trim()) return;
        setIsLoading(true);
        setTranslatedText('');
        addLog({ service: 'Translator', level: 'info', message: 'Translating text.' });
        try {
            const provider = localStorage.getItem('translationProvider') || 'google';
            const { response, logs } = await getTranslation({ text: translateText, provider, sourceLang, targetLang });
            setTranslatedText(response.text);
            logs.forEach(log => addLog(log));
        } catch (e) {
            const err = e as Error;
            toast({ title: "Translation Error", description: err.message, variant: 'destructive' });
            addLog({ service: 'Translator', level: 'error', message: 'Failed to translate.', details: err.stack });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSpeak = async () => {
        if (!ttsText.trim()) return;
        setIsLoading(true);
        addLog({ service: 'TTS', level: 'info', message: 'Generating speech from text.' });
        try {
            const provider = localStorage.getItem('ttsProvider') || 'google';
            const { media } = await getTTSAudio({ text: ttsText, voice: provider });

            if (ttsAudioRef.current) {
                ttsAudioRef.current.src = media;
                ttsAudioRef.current.play().catch(e => {
                    toast({ title: 'Audio Error', description: 'Could not play TTS audio.', variant: 'destructive' });
                    console.error(e);
                });
            }
        } catch (e) {
            const err = e as Error;
            toast({ title: "TTS Error", description: err.message, variant: 'destructive' });
            addLog({ service: 'TTS', level: 'error', message: 'Failed to generate speech.', details: err.stack });
        } finally {
            setIsLoading(false);
        }
    };

    const handleTranscribe = async () => {
        if (!audioFile) return;
        setIsLoading(true);
        setTranscribedText('');
        addLog({ service: 'Transcription', level: 'info', message: 'Transcribing audio file.' });
        try {
            const provider = localStorage.getItem('sttProvider') || 'openai';
            const { response, logs } = await getTranscription({ file: audioFile, provider, language: 'en' });
            setTranscribedText(response.text);
            logs.forEach(log => addLog(log));
        } catch (e) {
            const err = e as Error;
            toast({ title: "Transcription Error", description: err.message, variant: 'destructive' });
            addLog({ service: 'Transcription', level: 'error', message: 'Failed to transcribe audio.', details: err.stack });
        } finally {
            setIsLoading(false);
        }
    };
    
    const copyToClipboard = (text: string) => {
        if(!text) return;
        navigator.clipboard.writeText(text).then(() => {
            toast({ title: "Copied to Clipboard" });
        });
    };

    return (
        <>
        <audio ref={ttsAudioRef} className="hidden" />
        <Card className="flex flex-col h-full">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 flex-grow">
                        <Button variant="ghost" size="icon" {...dragHandleProps} className="cursor-grab p-1 h-auto w-auto text-accent">
                            <GripVertical />
                        </Button>
                        <div className="flex-grow">
                            <CardTitle className="flex items-center gap-2 text-title-foreground">
                                <Languages className="h-6 w-6 text-primary" />
                                Translator
                            </CardTitle>
                            <CardDescription>
                                Translate, Transcribe, and Synthesize.
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center">
                        {!isPoppedOut && onHide && (
                            <Button variant="ghost" size="icon" onClick={onHide} className="text-primary">
                                <EyeOff className="h-4 w-4" />
                            </Button>
                        )}
                        {!isPoppedOut && onPopOut && <PopOutButton onClick={onPopOut} />}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col gap-4">
                <Tabs defaultValue="translate" className="w-full flex-grow flex flex-col">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="translate"><ArrowRightLeft className="h-4 w-4 mr-2"/>Translate</TabsTrigger>
                        <TabsTrigger value="tts"><Volume2 className="h-4 w-4 mr-2"/>Text-to-Speech</TabsTrigger>
                        <TabsTrigger value="stt"><FileAudio className="h-4 w-4 mr-2"/>Speech-to-Text</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="translate" className="flex-grow flex flex-col gap-4 mt-4">
                        <div className="flex-grow flex flex-col gap-4">
                            <Textarea placeholder="Enter text to translate..." value={translateText} onChange={e => setTranslateText(e.target.value)} className="flex-grow"/>
                            {translatedText && (
                                <Alert>
                                    <Languages className="h-4 w-4 text-primary" />
                                    <div className="flex justify-between items-start">
                                        <div className="flex-grow">
                                            <AlertTitle>Translation Result</AlertTitle>
                                            <AlertDescription>{translatedText}</AlertDescription>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(translatedText)}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </Alert>
                            )}
                        </div>
                         <div className="flex items-center justify-between mt-auto gap-2">
                             <div className="flex items-center gap-2">
                                <Input value={sourceLang} onChange={e => setSourceLang(e.target.value)} placeholder="src"/>
                                <ArrowRightLeft className="h-4 w-4"/>
                                <Input value={targetLang} onChange={e => setTargetLang(e.target.value)} placeholder="tgt"/>
                             </div>
                             <Button onClick={handleTranslate} disabled={isLoading || !translateText}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Languages className="mr-2 h-4 w-4" />}
                                Translate
                             </Button>
                         </div>
                    </TabsContent>

                    <TabsContent value="tts" className="flex-grow flex flex-col gap-4 mt-4">
                        <Textarea placeholder="Enter text to generate speech..." value={ttsText} onChange={e => setTtsText(e.target.value)} className="flex-grow"/>
                        <div className="mt-auto">
                            <Button onClick={handleSpeak} disabled={isLoading || !ttsText} className="w-full">
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4" />}
                                Speak
                            </Button>
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="stt" className="flex-grow flex flex-col gap-4 mt-4">
                        <div className="flex-grow flex flex-col gap-4">
                            <div className="flex items-center justify-center w-full">
                                <Label htmlFor="audio-file-stt" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <FileAudio className="w-8 h-8 mb-4"/>
                                        <p className="mb-2 text-sm"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                        <p className="text-xs">Audio File (MP3, WAV, etc.)</p>
                                    </div>
                                    <Input id="audio-file-stt" type="file" className="hidden" ref={fileInputRef} onChange={e => setAudioFile(e.target.files?.[0] || null)} />
                                </Label>
                            </div> 
                            {audioFile && <p className="text-sm text-center">Selected: {audioFile.name}</p>}
                            {transcribedText && (
                                <Alert>
                                    <Mic className="h-4 w-4 text-primary" />
                                    <div className="flex justify-between items-start">
                                        <div className="flex-grow">
                                            <AlertTitle>Transcription Result</AlertTitle>
                                            <AlertDescription>{transcribedText}</AlertDescription>
                                        </div>
                                         <Button variant="ghost" size="icon" onClick={() => copyToClipboard(transcribedText)}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </Alert>
                            )}
                        </div>
                        <div className="mt-auto">
                            <Button onClick={handleTranscribe} disabled={isLoading || !audioFile} className="w-full">
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4" />}
                                Transcribe
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
        </>
    );
}
