"use client";

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PopOutButton } from './pop-out-button';
import { Package, GripVertical, EyeOff, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getSandboxComponents } from '@/services/ai';
import { useLogs } from '@/context/LogContext';

interface ModuleLoaderProps {
    onPopOut?: () => void;
    isPoppedOut?: boolean;
    onHide?: () => void;
    dragHandleProps?: any;
    isPreview?: boolean;
}

export function ModuleLoader({ onPopOut, isPoppedOut = false, onHide, dragHandleProps, isPreview }: ModuleLoaderProps) {
    const [components, setComponents] = useState<string[]>([]);
    const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { addLog } = useLogs();

    useEffect(() => {
        const fetchComponents = async () => {
            setIsLoading(true);
            try {
                const { components: componentFiles } = await getSandboxComponents();
                setComponents(componentFiles);
                if (componentFiles.length > 0) {
                    setSelectedComponent(componentFiles[0]);
                }
            } catch (error) {
                console.error("Failed to load sandbox components", error);
                addLog({ service: 'System', level: 'error', message: 'Failed to load sandbox components.', details: error instanceof Error ? error.stack : undefined });
            } finally {
                setIsLoading(false);
            }
        };

        if (!isPreview) {
            fetchComponents();
        }
    }, [addLog, isPreview]);

    const LoadedComponent = useMemo(() => {
        if (!selectedComponent) return null;
        return dynamic(() => import(`@/components/sandbox/finished_code/${selectedComponent.replace('.tsx', '')}`), {
            loading: () => <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>,
            ssr: false,
        });
    }, [selectedComponent]);

    return (
        <Card className="flex flex-col h-full bg-secondary/20">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 flex-grow">
                        <Button variant="ghost" size="icon" {...dragHandleProps} className="cursor-grab p-1 h-auto w-auto text-accent">
                            <GripVertical />
                        </Button>
                        <div className="flex-grow">
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-6 w-6 text-primary" />
                                Module Loader
                            </CardTitle>
                            <CardDescription>
                                Load and display components from your finished code sandbox.
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
            <CardContent className="flex-grow flex flex-col gap-4 overflow-hidden">
                <div className="shrink-0">
                    <Select value={selectedComponent || ''} onValueChange={setSelectedComponent} disabled={isLoading || components.length === 0}>
                        <SelectTrigger>
                            <SelectValue placeholder={isLoading ? "Loading components..." : "Select a component..."} />
                        </SelectTrigger>
                        <SelectContent>
                            {components.map((componentFile) => (
                                <SelectItem key={componentFile} value={componentFile}>
                                    {componentFile}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex-grow rounded-lg border bg-background overflow-auto p-2">
                    {LoadedComponent ? (
                        <LoadedComponent />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            {isLoading ? 'Loading...' : 'No component selected or no components found in finished_code.'}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
