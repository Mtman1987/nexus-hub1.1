
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Bot, Twitch, BookText, Radio, Info, Save, GripVertical, EyeOff } from 'lucide-react';
import DiscordLogo from '@/components/icons/discord-logo';
import { useLogs, type LogEntry } from '@/context/LogContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PopOutButton } from './pop-out-button';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

interface LogViewerProps {
  onPopOut?: () => void;
  isPoppedOut?: boolean;
  onHide?: () => void;
  dragHandleProps?: any;
  isPreview?: boolean;
}

const serviceIcons: { [key: string]: React.ReactNode } = {
  Discord: <DiscordLogo className="h-4 w-4" />,
  Twitch: <Twitch className="h-4 w-4" />,
  'Eden': <Bot className="h-4 w-4" />,
  'Google AI': <Bot className="h-4 w-4" />,
  'Streamer.bot': <Radio className="h-4 w-4" />,
  System: <BookText className="h-4 w-4" />,
};

const levelColors = {
  info: 'default',
  warn: 'secondary',
  error: 'destructive',
} as const;

export function LogViewer({ onPopOut, isPoppedOut = false, onHide, dragHandleProps, isPreview }: LogViewerProps) {
  const { logs } = useLogs();
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const { toast } = useToast();

  const handleRowClick = (log: LogEntry) => {
    setSelectedLog(log);
  };

  const handleCloseDialog = () => {
    setSelectedLog(null);
  };

  const handleSaveLog = (log: LogEntry) => {
    try {
        const savedItems = JSON.parse(localStorage.getItem('apollo-station-saved-items') || '[]');
        const newItem = {
            id: `log-${Date.now()}`,
            type: 'log',
            content: log,
            savedAt: new Date().toISOString(),
        };

        const newItems = [newItem, ...savedItems];
        localStorage.setItem('apollo-station-saved-items', JSON.stringify(newItems));
        toast({
            title: "Log Saved",
            description: "The log entry has been saved to your Saved Items.",
        });
        window.dispatchEvent(new Event('storage')); // Notify other components
    } catch(e) {
        toast({
            title: "Save Failed",
            description: "Could not save log to local storage.",
            variant: "destructive"
        });
    }
  };
  
  const recentLogs = logs.slice(0, 5);

  return (
    <>
      <Card className="flex flex-col bg-card/80">
        <CardHeader className="shrink-0">
          <div className="flex justify-between items-start">
             <div className="flex items-center gap-2 flex-grow">
               <Button variant="ghost" size="icon" {...dragHandleProps} className="cursor-grab p-1 h-auto w-auto">
                <GripVertical />
              </Button>
              <div className="flex-grow">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <BookText className="h-6 w-6 text-accent" />
                  Captain's Log
                </CardTitle>
                <CardDescription>Live feed of all service activities. Click a row for more details.</CardDescription>
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
        <CardContent className="flex-grow overflow-hidden flex flex-col">
           <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="logs">
                 <div className="overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Service</TableHead>
                            <TableHead>Message</TableHead>
                            <TableHead className="text-right">Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentLogs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground">
                                No log entries yet.
                                </TableCell>
                            </TableRow>
                            ) : (
                            recentLogs.map((log, index) => (
                                <TableRow key={index} onClick={() => handleRowClick(log)} className="cursor-pointer">
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                    {serviceIcons[log.service] || <BookText className="h-4 w-4" />}
                                    <span className="font-medium">{log.service}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                    <Badge variant={levelColors[log.level as keyof typeof levelColors]} className="capitalize text-xs">{log.level}</Badge>
                                    <span className="truncate">{log.message}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">{log.timestamp}</TableCell>
                                </TableRow>
                            ))
                            )}
                        </TableBody>
                    </Table>
                     <AccordionTrigger className="text-sm p-2 justify-center hover:no-underline">
                        {logs.length > 5 ? `Show all ${logs.length} logs...` : 'Full Log History'}
                     </AccordionTrigger>
                 </div>
                <AccordionContent>
                    <ScrollArea className="h-64">
                         <Table>
                             <TableBody>
                                {logs.map((log, index) => (
                                    <TableRow key={index} onClick={() => handleRowClick(log)} className="cursor-pointer">
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                        {serviceIcons[log.service] || <BookText className="h-4 w-4" />}
                                        <span className="font-medium">{log.service}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                        <Badge variant={levelColors[log.level as keyof typeof levelColors]} className="capitalize text-xs">{log.level}</Badge>
                                        <span className="truncate">{log.message}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground">{log.timestamp}</TableCell>
                                    </TableRow>
                                ))}
                             </TableBody>
                         </Table>
                    </ScrollArea>
                </AccordionContent>
            </AccordionItem>
           </Accordion>
        </CardContent>
      </Card>

      {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={(isOpen) => !isOpen && handleCloseDialog()}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-primary">
                {serviceIcons[selectedLog.service] || <Info className="h-6 w-6" />}
                Log Details
              </DialogTitle>
              <DialogDescription>
                Detailed information for the selected log entry from <span className="font-semibold text-foreground">{selectedLog.service}</span>.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <div>
                    <h4 className="font-semibold mb-1">Message</h4>
                    <p className="text-sm">{selectedLog.message}</p>
                </div>
                 <div>
                    <h4 className="font-semibold mb-1">Timestamp</h4>
                    <p className="text-sm text-muted-foreground">{selectedLog.timestamp}</p>
                </div>
                {selectedLog.details && (
                    <div>
                        <h4 className="font-semibold mb-1">Technical Details</h4>
                        <ScrollArea className="h-48 w-full bg-muted rounded-md border p-3">
                           <pre className="text-xs whitespace-pre-wrap break-words">
                            {selectedLog.details}
                           </pre>
                        </ScrollArea>
                    </div>
                )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleSaveLog(selectedLog)}>
                <Save className="mr-2 h-4 w-4" />
                Save Log
              </Button>
              <Button onClick={handleCloseDialog}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
