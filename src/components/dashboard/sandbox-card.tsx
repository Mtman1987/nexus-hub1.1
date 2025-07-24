
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PopOutButton } from './pop-out-button';
import { Beaker, GripVertical, EyeOff } from 'lucide-react';

interface SandboxCardProps {
    onPopOut?: () => void;
    isPoppedOut?: boolean;
    onHide?: () => void;
    dragHandleProps?: any;
    isPreview?: boolean;
}

export function SandboxCard({ onPopOut, isPoppedOut = false, onHide, dragHandleProps, isPreview }: SandboxCardProps) {
    return (
        <Card className="flex flex-col h-full bg-secondary/20">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 flex-grow">
                        <Button variant="ghost" size="icon" {...dragHandleProps} className="cursor-grab p-1 h-auto w-auto text-secondary">
                            <GripVertical />
                        </Button>
                        <div className="flex-grow">
                            <CardTitle className="flex items-center gap-2">
                                <Beaker className="h-6 w-6 text-primary" />
                                AI Sandbox
                            </CardTitle>
                            <CardDescription>
                                A place to test AI-generated components.
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
            <CardContent className="flex-grow flex flex-col items-center justify-center text-center">
                <p>Waiting for AI-generated code...</p>
            </CardContent>
        </Card>
    );
}
