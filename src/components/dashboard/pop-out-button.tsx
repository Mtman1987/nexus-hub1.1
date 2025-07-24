
"use client";

import { Button } from "@/components/ui/button";
import { Expand } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PopOutButtonProps {
    onClick: () => void;
}

export function PopOutButton({ onClick }: PopOutButtonProps) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={onClick} className="h-8 w-8 text-primary hover:text-primary/80">
                        <Expand className="h-4 w-4" />
                        <span className="sr-only">Pop-out Module</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Pop-out Module</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
