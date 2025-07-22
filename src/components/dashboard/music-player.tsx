
"use client";

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PopOutButton } from './pop-out-button';
import { Music, Play, Pause, Rewind, FastForward, GripVertical, EyeOff, Volume2, VolumeX } from 'lucide-react';
import { Slider } from '../ui/slider';
import { useLogs } from '@/context/LogContext';

const initialPlaylist = [
    { title: "Lost in the Cosmos", artist: "Stellardrone", src: "https://www.chosic.com/wp-content/uploads/2021/05/Stellardrone-Lost-In-The-Cosmos.mp3", type: 'audio' },
    { title: "The Final Mission", artist: "Rozcoli", src: "https://www.chosic.com/wp-content/uploads/2022/08/The-Final-Mission.mp3", type: 'audio' },
    { title: "Sci-Fi", artist: "Alexander Nakarada", src: "https://www.chosic.com/wp-content/uploads/2021/07/Sci-fi.mp3", type: 'audio' },
];

interface MusicPlayerProps {
    onPopOut?: () => void;
    isPoppedOut?: boolean;
    onHide?: () => void;
    dragHandleProps?: any;
    isPreview?: boolean;
}

export function MusicPlayer({ onPopOut, isPoppedOut = false, onHide, dragHandleProps, isPreview }: MusicPlayerProps) {
    const { addLog } = useLogs();
    const [playlist, setPlaylist] = useState(initialPlaylist);
    const [isPlaying, setIsPlaying] = useState(false);
    const [trackIndex, setTrackIndex] = useState(0);
    const [volume, setVolume] = useState(0.5);
    const [isMuted, setIsMuted] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    const audioRef = useRef<HTMLAudioElement>(null);

     useEffect(() => {
        if (isPreview) return;
        const channel = new BroadcastChannel('apollo-station-music-player');

        const handleMessage = (event: MessageEvent) => {
            if (event.data && event.data.action === 'add_youtube_song' && event.data.payload) {
                const newTrack = {
                    title: "YouTube Import",
                    artist: "Via Website Control",
                    src: event.data.payload,
                    type: 'youtube'
                };
                addLog({
                    service: 'Music Player',
                    level: 'info',
                    message: `Received new YouTube track to add to playlist.`,
                    details: `URL: ${event.data.payload}`,
                });
                setPlaylist(prev => [...prev, newTrack]);
                // Optional: jump to the new track
                setTrackIndex(playlist.length);
                setIsPlaying(false);
            }
        };

        channel.addEventListener('message', handleMessage);
        return () => {
            channel.removeEventListener('message', handleMessage);
            channel.close();
        };
    }, [addLog, playlist.length, isPreview]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        
        const setAudioData = () => {
            setDuration(audio.duration);
            setCurrentTime(audio.currentTime);
        }

        const setAudioTime = () => setCurrentTime(audio.currentTime);
        
        audio.addEventListener('loadeddata', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);

        audio.volume = isMuted ? 0 : volume;

        return () => {
            audio.removeEventListener('loadeddata', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
        }
    }, [volume, isMuted, trackIndex]);
    
    useEffect(() => {
        const currentTrack = playlist[trackIndex];
        if (currentTrack?.type === 'audio' && isPlaying) {
            audioRef.current?.play().catch(e => console.error("Audio play failed:", e));
        } else {
            audioRef.current?.pause();
        }
    }, [isPlaying, trackIndex, playlist]);

    const togglePlayPause = () => {
        const currentTrack = playlist[trackIndex];
        if (currentTrack.type === 'youtube') {
            window.open(currentTrack.src, '_blank');
        } else {
            setIsPlaying(prev => !prev);
        }
    };

    const nextTrack = () => {
        setTrackIndex(prev => (prev + 1) % playlist.length);
        setIsPlaying(true);
    };

    const prevTrack = () => {
        setTrackIndex(prev => (prev - 1 + playlist.length) % playlist.length);
        setIsPlaying(true);
    };

    const handleVolumeChange = (value: number[]) => {
        setVolume(value[0]);
        if (isMuted) setIsMuted(false);
    };

    const toggleMute = () => {
        setIsMuted(prev => !prev);
    };
    
    const formatTime = (time: number) => {
        if (isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const currentTrack = playlist[trackIndex];

    return (
        <>
            <audio ref={audioRef} src={currentTrack?.type === 'audio' ? currentTrack.src : ''} onEnded={nextTrack} />
            <Card className="flex flex-col bg-card/80">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 flex-grow">
                            <Button variant="ghost" size="icon" {...dragHandleProps} className="cursor-grab p-1 h-auto w-auto">
                                <GripVertical />
                            </Button>
                            <div className="flex-grow">
                                <CardTitle className="flex items-center gap-2 text-title-foreground">
                                    <Music className="h-6 w-6" />
                                    Subspace Comms
                                </CardTitle>
                                <CardDescription>
                                    Ambient music for deep space focus.
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
                <CardContent className="flex-grow flex flex-col items-center justify-center text-center space-y-4">
                   <div className="w-full h-24 bg-cover bg-center rounded-lg flex items-center justify-center" style={{backgroundImage: 'url(https://placehold.co/600x400.png)', backgroundSize: 'cover'}} data-ai-hint="nebula space">
                       <div className="p-4 rounded-lg bg-black/50 backdrop-blur-sm text-white">
                            <p className="font-bold text-lg">{currentTrack?.title || "No Track"}</p>
                            <p className="text-sm">{currentTrack?.artist || "Select a song"}</p>
                       </div>
                   </div>

                    <div className="w-full space-y-2">
                        <Slider
                            value={[currentTime]}
                            max={duration || 100}
                            onValueChange={(value) => { if(audioRef.current && currentTrack?.type === 'audio') audioRef.current.currentTime = value[0] }}
                            className="w-full"
                            disabled={currentTrack?.type === 'youtube'}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{currentTrack?.type === 'audio' ? formatTime(currentTime) : '0:00'}</span>
                            <span>{currentTrack?.type === 'audio' ? formatTime(duration) : 'External'}</span>
                        </div>
                    </div>
                   
                   <div className="flex items-center justify-center gap-4">
                        <Button variant="ghost" size="icon" onClick={prevTrack}>
                            <Rewind className="h-6 w-6" />
                        </Button>
                        <Button size="lg" className="rounded-full w-16 h-16" onClick={togglePlayPause}>
                            {isPlaying && currentTrack?.type === 'audio' ? <Pause className="h-8 w-8"/> : <Play className="h-8 w-8"/>}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={nextTrack}>
                            <FastForward className="h-6 w-6" />
                        </Button>
                   </div>
                   
                    <div className="flex items-center gap-2 w-full pt-4">
                        <Button variant="ghost" size="icon" onClick={toggleMute}>
                           {isMuted ? <VolumeX className="h-5 w-5"/> : <Volume2 className="h-5 w-5"/>}
                        </Button>
                        <Slider
                            value={[isMuted ? 0 : volume]}
                            max={1}
                            step={0.01}
                            onValueChange={handleVolumeChange}
                            className="w-full"
                            disabled={currentTrack?.type === 'youtube'}
                        />
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
