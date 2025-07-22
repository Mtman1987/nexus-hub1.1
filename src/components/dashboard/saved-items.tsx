
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, Trash2, Bot, User, BookText, GripVertical, EyeOff, FileText, Wand2, Edit, Loader2, Send } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { PopOutButton } from './pop-out-button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Dialog, DialogContent as EditDialogContent, DialogHeader as EditDialogHeader, DialogTitle as EditDialogTitle, DialogDescription as EditDialogDescription, DialogFooter as EditDialogFooter } from '@/components/ui/dialog';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { getLoreEditorSuggestion, getCuratedTimeline } from '@/services/ai';
import { Alert, AlertTitle as UiAlertTitle, AlertDescription as UiAlertDescription } from '@/components/ui/alert';


export type SavedItem = {
  id: string;
  type: 'log' | 'chat' | 'lore';
  content: any;
  savedAt: string;
};

export type LoreContent = {
    prompt: string;
    response: string;
}

export type TimelineItem = LoreContent;

interface SavedItemsProps {
  onPopOut?: () => void;
  isPoppedOut?: boolean;
  onHide?: () => void;
  dragHandleProps?: any;
  isPreview?: boolean;
}

const SAVED_ITEMS_KEY = 'apollo-station-saved-items';
const TIMELINE_KEY = 'apollo-station-timeline';


export function SavedItems({ onPopOut, isPoppedOut = false, onHide, dragHandleProps, isPreview }: SavedItemsProps) {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const { toast } = useToast();

  const [editingLore, setEditingLore] = useState<SavedItem | null>(null);
  const [draftContent, setDraftContent] = useState<LoreContent>({ prompt: '', response: '' });
  const [aiRequest, setAiRequest] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);


  const loadItems = useCallback(() => {
    if (isPreview) return;
    try {
      const storedItems = localStorage.getItem(SAVED_ITEMS_KEY);
      if (storedItems) setSavedItems(JSON.parse(storedItems));

      const storedTimeline = localStorage.getItem(TIMELINE_KEY);
      if(storedTimeline) setTimeline(JSON.parse(storedTimeline));

    } catch (error) {
      console.error("Failed to load saved items from localStorage", error);
      toast({ title: "Error", description: "Could not load saved items.", variant: "destructive" });
    }
  }, [toast, isPreview]);

  useEffect(() => {
    loadItems();
    const handleStorage = (e: StorageEvent) => {
        if (e.key === SAVED_ITEMS_KEY || e.key === TIMELINE_KEY) {
            loadItems();
        }
    }
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [loadItems]);

  const removeItem = (id: string) => {
    const newItems = savedItems.filter(item => item.id !== id);
    localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(newItems));
    setSavedItems(newItems);
    toast({ title: "Item Removed", description: "The saved item has been deleted." });
  };
  
  const clearAllItems = () => {
    localStorage.removeItem(SAVED_ITEMS_KEY);
    setSavedItems([]);
    toast({ title: "All Pinned Items Cleared", variant: "destructive" });
  };

  const clearTimeline = () => {
    localStorage.removeItem(TIMELINE_KEY);
    setTimeline([]);
    toast({ title: "Timeline Cleared", variant: "destructive" });
  };

  const handleEdit = (item: SavedItem) => {
    setEditingLore(item);
    setDraftContent(item.content);
    setAiSuggestion(null);
    setAiRequest('');
  };

  const handleAskCosmo = async () => {
    if (!aiRequest) return;
    setIsAiLoading(true);
    setAiSuggestion(null);
    try {
        const { suggestion } = await getLoreEditorSuggestion({ currentDraft: draftContent.response, userRequest: aiRequest });
        setAiSuggestion(suggestion);
    } catch(e) {
        const error = e as Error;
        toast({ title: "COSMO Error", description: error.message, variant: "destructive" });
    } finally {
        setIsAiLoading(false);
    }
  };
  
  const handleFinalize = async () => {
    setIsFinalizing(true);
    try {
        const { sortedTimeline } = await getCuratedTimeline({
            existingTimeline: timeline,
            newLore: draftContent
        });
        
        setTimeline(sortedTimeline);
        localStorage.setItem(TIMELINE_KEY, JSON.stringify(sortedTimeline));
        
        // Remove the draft from saved items
        if(editingLore) removeItem(editingLore.id);

        setEditingLore(null);
        toast({title: "Timeline Updated", description: "COSMO has placed the new lore into the Galactic Timeline."});

    } catch(e) {
        const error = e as Error;
        toast({ title: "Finalizing Error", description: error.message, variant: "destructive" });
    } finally {
        setIsFinalizing(false);
    }
  };

  const renderItemContent = (item: SavedItem) => {
    switch (item.type) {
        case 'lore':
            return (
                <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 mt-1 text-muted-foreground" />
                    <div className="flex-grow">
                        <p className="font-semibold text-accent">Draft: <span className="font-normal text-foreground">{item.content.prompt}</span></p>
                        <p className="text-sm text-muted-foreground truncate">{item.content.response}</p>
                    </div>
                </div>
            );
        case 'log':
            return (
                <div className="flex items-start gap-3">
                    <BookText className="h-5 w-5 mt-1 text-muted-foreground" />
                    <div className="flex-grow">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">{item.content.service}</span>
                            <Badge variant={item.content.level === 'error' ? 'destructive' : 'secondary'} className="capitalize">{item.content.level}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.content.message}</p>
                        <p className="text-xs text-muted-foreground/50 mt-1">{item.content.timestamp}</p>
                    </div>
                </div>
            );
        case 'chat':
            return (
                <div className="flex items-start gap-3">
                    {item.content.sender === 'ai' ? <Bot className="h-5 w-5 mt-1 text-accent" /> : <User className="h-5 w-5 mt-1" />}
                    <div className="flex-grow">
                        <p className="text-sm">{item.content.text}</p>
                    </div>
                </div>
            );
        default:
            return <p>Unknown item type</p>;
    }
  };

  const loreDrafts = savedItems.filter(item => item.type === 'lore');
  const otherItems = savedItems.filter(item => item.type !== 'lore');
  
  return (
    <>
    <Card className="flex flex-col bg-card/80" style={{ height: '480px' }}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2 flex-grow">
             <Button variant="ghost" size="icon" {...dragHandleProps} className="cursor-grab p-1 h-auto w-auto">
                <GripVertical />
              </Button>
            <div className="flex-grow">
              <CardTitle className="flex items-center gap-2 text-title-foreground">
                <Save className="h-6 w-6 text-accent" />
                Saved Items
              </CardTitle>
              <CardDescription>Your drafts, timeline, and pinned items.</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
             {!isPoppedOut && onHide && (
                <Button variant="ghost" size="icon" onClick={onHide}>
                  <EyeOff className="h-4 w-4" />
                </Button>
              )}
             {!isPoppedOut && onPopOut && <PopOutButton onClick={onPopOut} />}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full pr-4 bg-transparent">
            <div className="space-y-6">
                
                {/* TIMELINE */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-lg text-title-foreground">Galactic Timeline</h4>
                        {timeline.length > 0 && (
                             <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="destructive" size="sm">Clear Timeline</Button></AlertDialogTrigger>
                                <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Clear Entire Timeline?</AlertDialogTitle><AlertDialogDescription>This will permanently delete all {timeline.length} timeline entries.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={clearTimeline}>Yes, Clear</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                    {timeline.length > 0 ? (
                        <ol className="relative border-l border-primary/50 ml-2 space-y-6">                  
                           {timeline.map((item, index) => (
                              <li key={index} className="ml-6">            
                                <span className="absolute flex items-center justify-center w-4 h-4 bg-primary rounded-full -left-2 ring-4 ring-background"></span>
                                <p className="font-semibold">{item.prompt}</p>
                                <p className="text-sm text-muted-foreground">{item.response}</p>
                              </li>
                           ))}
                        </ol>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">The timeline is empty. Finalize a lore draft to begin.</p>
                    )}
                </div>

                <Separator />
                
                {/* DRAFTS */}
                <div className="space-y-3">
                     <h4 className="font-semibold text-lg text-title-foreground">Idea Drafts</h4>
                     {loreDrafts.length > 0 ? (
                        loreDrafts.map(item => (
                            <div key={item.id} className="flex items-center gap-2 rounded-lg border p-3">
                                <div className="flex-grow">{renderItemContent(item)}</div>
                                <Button variant="outline" size="sm" onClick={() => handleEdit(item)}><Edit className="mr-2 h-4 w-4"/>Finalize</Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        ))
                     ) : (
                         <p className="text-sm text-muted-foreground text-center py-4">Save lore from the Lore Weaver to create drafts.</p>
                     )}
                </div>

                <Separator />

                {/* OTHER ITEMS */}
                 <div className="space-y-3">
                     <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-lg text-title-foreground">Pinned Items</h4>
                         {otherItems.length > 0 && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="destructive" size="sm">Clear Items</Button></AlertDialogTrigger>
                                <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Clear All Pinned Items?</AlertDialogTitle><AlertDialogDescription>This will delete all {otherItems.length} saved chats and logs.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={clearAllItems}>Yes, Clear</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                         )}
                     </div>
                    {otherItems.length > 0 ? (
                        otherItems.map(item => (
                            <div key={item.id} className="flex items-start gap-2 rounded-lg border p-3">
                                <div className="flex-grow">{renderItemContent(item)}</div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeItem(item.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))
                    ) : (
                         <p className="text-sm text-muted-foreground text-center py-4">Save chats or logs to pin them here.</p>
                    )}
                 </div>
            </div>
        </ScrollArea>
      </CardContent>
    </Card>

    {/* LORE EDIT DIALOG */}
    <Dialog open={!!editingLore} onOpenChange={(isOpen) => !isOpen && setEditingLore(null)}>
        <EditDialogContent className="max-w-2xl">
            <EditDialogHeader>
                <EditDialogTitle>Finalize Lore Entry</EditDialogTitle>
                <EditDialogDescription>Refine your lore, ask COSMO for help, and then finalize it to add it to the official timeline.</EditDialogDescription>
            </EditDialogHeader>
            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="space-y-2">
                    <Label htmlFor="lore-prompt">Prompt / Title</Label>
                    <Input id="lore-prompt" value={draftContent.prompt} onChange={(e) => setDraftContent({...draftContent, prompt: e.target.value})} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lore-response">Lore Content</Label>
                    <Textarea id="lore-response" value={draftContent.response} onChange={(e) => setDraftContent({...draftContent, response: e.target.value})} className="h-32" />
                </div>
                <Separator />
                <div className="space-y-3 p-3 border rounded-lg">
                    <Label htmlFor="ai-request">Ask COSMO for Help</Label>
                     <p className="text-xs text-muted-foreground">Ask for ideas, better wording, or to expand on a topic.</p>
                    <div className="flex gap-2">
                        <Input id="ai-request" placeholder="e.g., 'Give me a better name for this planet'" value={aiRequest} onChange={e => setAiRequest(e.target.value)} />
                        <Button onClick={handleAskCosmo} disabled={isAiLoading || !aiRequest}><Wand2 className="h-4 w-4"/></Button>
                    </div>
                    {isAiLoading && <Loader2 className="h-5 w-5 animate-spin mx-auto" />}
                    {aiSuggestion && (
                        <UiAlert>
                            <Wand2 className="h-4 w-4" />
                            <UiAlertTitle>COSMO Suggests</UiAlertTitle>
                            <UiAlertDescription>{aiSuggestion}</UiAlertDescription>
                        </UiAlert>
                    )}
                </div>
            </div>
            <EditDialogFooter>
                <Button variant="ghost" onClick={() => setEditingLore(null)}>Cancel</Button>
                <Button onClick={handleFinalize} disabled={isFinalizing}>
                    {isFinalizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
                    Finalize & Add to Timeline
                </Button>
            </EditDialogFooter>
        </EditDialogContent>
    </Dialog>
    </>
  );
}

    