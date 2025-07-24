
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, FileText, GripVertical, EyeOff, ClipboardCheck, User, Briefcase, GraduationCap, Sparkles, Mail, Phone, Link as LinkIcon, Building, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PopOutButton } from './pop-out-button';
import { useLogs } from '@/context/LogContext';
import { getParsedResume } from '@/services/ai';
import type { ResumeParserOutput } from '@/ai/types';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

interface ResumeParserProps {
  onPopOut?: () => void;
  isPoppedOut?: boolean;
  onHide?: () => void;
  dragHandleProps?: any;
  isPreview?: boolean;
}

export function ResumeParser({ onPopOut, isPoppedOut = false, onHide, dragHandleProps, isPreview }: ResumeParserProps) {
    const [fileUrl, setFileUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<ResumeParserOutput | null>(null);
    const { toast } = useToast();
    const { addLog } = useLogs();

    const handleParseResume = async () => {
        if (!fileUrl.trim()) {
            toast({ title: "URL Required", description: "Please enter a URL to a resume file.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        setResult(null);

        addLog({ service: 'Resume Parser', level: 'info', message: "User initiated resume parsing.", details: `URL: ${fileUrl}` });
        
        try {
            const apiKey = localStorage.getItem('edenApiKey');
            if (!apiKey) {
                 toast({
                    title: "Missing Eden AI Key",
                    description: "Please enter your Eden AI API key in the API Vault.",
                    variant: "destructive"
                });
                addLog({ service: 'System', level: 'error', message: "Resume Parser failed: Eden AI API key is missing." });
                setIsLoading(false);
                return;
            }
            
            const { response, logs } = await getParsedResume({ fileUrl });
            setResult(response);
            logs.forEach(log => addLog(log));

        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            toast({
                title: "Parsing Failed",
                description: errorMessage,
                variant: "destructive"
            });
            addLog({ service: 'Resume Parser', level: 'error', message: `Parsing failed: ${errorMessage}`, details: error instanceof Error ? error.stack : String(error) });
        } finally {
            setIsLoading(false);
        }
    }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
             <div className="flex items-center gap-2 flex-grow">
               <Button variant="ghost" size="icon" {...dragHandleProps} className="cursor-grab p-1 h-auto w-auto">
                <GripVertical className="text-primary" />
              </Button>
              <div className="flex-grow">
                <CardTitle className="flex items-center gap-2 text-title-foreground">
                  <FileText className="h-6 w-6 text-primary" />
                  Resume Parser
                </CardTitle>
                <CardDescription>
                  Extract structured data from a resume URL (PDF, JPG, etc.).
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
        <div className="flex items-center gap-2">
            <Input 
                id="fileUrl" 
                placeholder="https://example.com/resume.pdf" 
                value={fileUrl} 
                onChange={(e) => setFileUrl(e.target.value)}
            />
            <Button onClick={handleParseResume} disabled={isLoading || !fileUrl}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ClipboardCheck className="mr-2 h-4 w-4" />}
                Parse
            </Button>
        </div>
        
        <ScrollArea className="flex-grow bg-muted/20 rounded-lg p-4">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin mb-2"/>
                    <p>Parsing resume...</p>
                </div>
            ) : result ? (
                <div className="space-y-6 text-sm">
                    {/* Personal Info */}
                    <div className="space-y-4">
                         <h3 className="font-semibold text-lg flex items-center gap-2"><User className="h-5 w-5 text-primary" />Personal Information</h3>
                         <div className="pl-6 space-y-2">
                            <p><strong>Name:</strong> {result.extracted_data.personal_infos.name?.raw_name || 'N/A'}</p>
                            <p className="flex items-center gap-2"><strong><Mail className="h-4 w-4" /></strong> {result.extracted_data.personal_infos.mails?.join(', ') || 'N/A'}</p>
                            <p className="flex items-center gap-2"><strong><Phone className="h-4 w-4" /></strong> {result.extracted_data.personal_infos.phones?.join(', ') || 'N/A'}</p>
                            <p className="flex items-center gap-2"><strong><LinkIcon className="h-4 w-4" /></strong> {result.extracted_data.personal_infos.websites?.join(', ') || 'N/A'}</p>
                            <p><strong>Summary:</strong> {result.extracted_data.personal_infos.self_summary || 'N/A'}</p>
                         </div>
                    </div>
                    <Separator />
                    {/* Skills */}
                     <div className="space-y-2">
                         <h3 className="font-semibold text-lg flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Skills</h3>
                         <div className="pl-6 flex flex-wrap gap-2">
                             {result.extracted_data.personal_infos.skills?.map((skill, i) => (
                                <Badge key={i} variant="secondary">{skill.name}</Badge>
                             )) || <p>N/A</p>}
                         </div>
                    </div>
                    <Separator />
                    {/* Work Experience */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary" />Work Experience</h3>
                        <div className="pl-6 space-y-4">
                        {result.extracted_data.work_experience.entries?.map((job, i) => (
                            <div key={i} className="space-y-1">
                                <p className="font-semibold">{job.title || 'N/A'}</p>
                                <p className="flex items-center gap-2"><Building className="h-4 w-4" />{job.company || 'N/A'}</p>
                                <p className="flex items-center gap-2 text-xs"><MapPin className="h-3 w-3" />{job.location?.raw_location || 'N/A'} | {job.start_date || 'N/A'} - {job.end_date || 'Present'}</p>
                                <p className="pt-1">{job.description || ''}</p>
                            </div>
                        )) || <p>N/A</p>}
                        </div>
                    </div>
                    <Separator />
                     {/* Education */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary" />Education</h3>
                         <div className="pl-6 space-y-4">
                        {result.extracted_data.education.entries?.map((edu, i) => (
                            <div key={i} className="space-y-1">
                                <p className="font-semibold">{edu.establishment || 'N/A'}</p>
                                <p>{edu.title || 'N/A'}</p>
                                <p className="text-xs">{edu.start_date || 'N/A'} - {edu.end_date || 'N/A'}</p>
                            </div>
                        )) || <p>N/A</p>}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full">
                    <FileText className="h-12 w-12 mb-2 text-primary" />
                    <p>Parsed resume data will appear here.</p>
                </div>
            )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
