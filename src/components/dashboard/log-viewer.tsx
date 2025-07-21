"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Bot, Twitch, BookText, Radio, Info } from 'lucide-react';
import DiscordLogo from '@/components/icons/discord-logo';
import { useLogs, type LogEntry } from '@/context/LogContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PopOutButton } from './pop-out-button';

interface LogViewerProps {
  onPopOut?: () => void;
  isPoppedOut?: boolean;
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

export function LogViewer({ onPopOut, isPoppedOut = false }: LogViewerProps) {
  const { logs } = useLogs();
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const handleRowClick = (log: LogEntry) => {
    setSelectedLog(log);
  };

  const handleCloseDialog = () => {
    setSelectedLog(null);
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-grow">
              <CardTitle className="flex items-center gap-2">
                <BookText className="h-6 w-6 text-accent" />
                Captain's Log
              </CardTitle>
              <CardDescription>Live feed of all service activities. Click a row for more details.</CardDescription>
            </div>
            {!isPoppedOut && onPopOut && <PopOutButton onClick={onPopOut} />}
          </div>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden">
          <ScrollArea className="h-full pr-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No log entries yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log, index) => (
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
          </ScrollArea>
        </CardContent>
      </Card>

      {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={(isOpen) => !isOpen && handleCloseDialog()}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
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
              <Button onClick={handleCloseDialog}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
