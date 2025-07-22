
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PopOutButton } from './pop-out-button';
import { Puzzle, GripVertical, EyeOff } from 'lucide-react';

interface CustomModuleProps {
    onPopOut?: () => void;
    isPoppedOut?: boolean;
    onHide?: () => void;
    dragHandleProps?: any;
    isPreview?: boolean;
}

export function CustomModule({ onPopOut, isPoppedOut = false, onHide, dragHandleProps, isPreview }: CustomModuleProps) {
    return (
        <Card className="flex flex-col bg-card/80 h-full">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 flex-grow">
                        <Button variant="ghost" size="icon" {...dragHandleProps} className="cursor-grab p-1 h-auto w-auto">
                            <GripVertical />
                        </Button>
                        <div className="flex-grow">
                            <CardTitle className="flex items-center gap-2 text-title-foreground">
                                <Puzzle className="h-6 w-6" />
                                Custom Module
                            </CardTitle>
                            <CardDescription>
                                A placeholder for your future creations.
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
            <CardContent className="flex-grow flex flex-col items-center justify-center text-center">
                <Puzzle className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">This space is reserved for a future feature.</p>
                <p className="text-xs text-muted-foreground/80 mt-1">You can edit this component in `src/components/dashboard/custom-module.tsx`</p>
            </CardContent>
        </Card>
    );
}
