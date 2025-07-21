
"use client";

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PopOutButton } from './pop-out-button';
import { Music, Play, Pause, Rewind, FastForward, GripVertical, EyeOff, Volume2, VolumeX } from 'lucide-react';
import { Slider } from '../ui/slider';

interface MusicPlayerProps {
    onPopOut?: () => void;
    isPoppedOut?: boolean;
    onHide?: () => void;
    dragHandleProps?: any;
}

const playlist = [
    { title: "Lost in the Cosmos", artist: "Stellardrone", src: "https://www.chosic.com/wp-content/uploads/2021/05/Stellardrone-Lost-In-The-Cosmos.mp3" },
    { title: "The Final Mission", artist: "Rozcoli", src: "https://www.chosic.com/wp-content/uploads/2022/08/The-Final-Mission.mp3" },
    { title: "Sci-Fi", artist: "Alexander Nakarada", src: "https://www.chosic.com/wp-content/uploads/2021/07/Sci-fi.mp3" },
];

export function MusicPlayer({ onPopOut, isPoppedOut = false, onHide, dragHandleProps }: MusicPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [trackIndex, setTrackIndex] = useState(0);
    const [volume, setVolume] = useState(0.5);
    const [isMuted, setIsMuted] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    const audioRef = useRef<HTMLAudioElement>(null);

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
        if(isPlaying) {
            audioRef.current?.play();
        } else {
            audioRef.current?.pause();
        }
    }, [isPlaying, trackIndex]);

    const togglePlayPause = () => {
        setIsPlaying(prev => !prev);
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

    return (
        <>
            <audio ref={audioRef} src={playlist[trackIndex].src} onEnded={nextTrack} />
            <Card className="h-full flex flex-col">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 flex-grow">
                            {dragHandleProps && (
                                <Button variant="ghost" size="icon" {...dragHandleProps} className="cursor-grab">
                                    <GripVertical />
                                </Button>
                            )}
                            <div className="flex-grow">
                                <CardTitle className="flex items-center gap-2">
                                    <Music className="h-6 w-6 text-accent" />
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
                            <p className="font-bold text-lg">{playlist[trackIndex].title}</p>
                            <p className="text-sm">{playlist[trackIndex].artist}</p>
                       </div>
                   </div>

                    <div className="w-full space-y-2">
                        <Slider
                            value={[currentTime]}
                            max={duration || 100}
                            onValueChange={(value) => { if(audioRef.current) audioRef.current.currentTime = value[0] }}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>
                   
                   <div className="flex items-center justify-center gap-4">
                        <Button variant="ghost" size="icon" onClick={prevTrack}>
                            <Rewind className="h-6 w-6" />
                        </Button>
                        <Button size="lg" className="rounded-full w-16 h-16" onClick={togglePlayPause}>
                            {isPlaying ? <Pause className="h-8 w-8"/> : <Play className="h-8 w-8"/>}
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
                        />
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
