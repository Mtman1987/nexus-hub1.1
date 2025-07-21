
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, Trash2, Bot, User, BookText, GripVertical, EyeOff, FileText } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { PopOutButton } from './pop-out-button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export type SavedItem = {
  id: string;
  type: 'log' | 'chat' | 'lore';
  content: any;
  savedAt: string;
};

interface SavedItemsProps {
  onPopOut?: () => void;
  isPoppedOut?: boolean;
  onHide?: () => void;
  dragHandleProps?: any;
}

const STORAGE_KEY = 'apollo-station-saved-items';

const SortableLoreItem = ({ item, removeItem, children }: { item: SavedItem, removeItem: (id: string) => void, children: React.ReactNode }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-start gap-2 rounded-lg border p-3 bg-card">
            <Button variant="ghost" size="icon" {...attributes} {...listeners} className="cursor-grab h-8 w-8 shrink-0">
                <GripVertical className="h-4 w-4" />
            </Button>
            <div className="flex-grow">{children}</div>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeItem(item.id)}>
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
};

export function SavedItems({ onPopOut, isPoppedOut = false, onHide, dragHandleProps }: SavedItemsProps) {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const { toast } = useToast();
  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const loadItems = useCallback(() => {
    try {
      const storedItems = localStorage.getItem(STORAGE_KEY);
      if (storedItems) {
        setSavedItems(JSON.parse(storedItems));
      }
    } catch (error) {
      console.error("Failed to load saved items from localStorage", error);
      toast({ title: "Error", description: "Could not load saved items.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    loadItems();
    window.addEventListener('storage', loadItems);
    return () => {
      window.removeEventListener('storage', loadItems);
    };
  }, [loadItems]);

  const removeItem = (id: string) => {
    const newItems = savedItems.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    setSavedItems(newItems);
    toast({ title: "Item Removed", description: "The saved item has been deleted." });
  };
  
  const clearAllItems = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSavedItems([]);
    toast({ title: "All Items Cleared", description: "All saved items have been deleted.", variant: "destructive" });
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = savedItems.findIndex(item => item.id === active.id);
      const newIndex = savedItems.findIndex(item => item.id === over.id);
      const newOrderedItems = arrayMove(savedItems, oldIndex, newIndex);
      setSavedItems(newOrderedItems);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrderedItems));
      toast({ title: "Timeline Updated", description: "Your lore timeline order has been saved." });
    }
  };


  const renderItemContent = (item: SavedItem) => {
    switch (item.type) {
        case 'lore':
            return (
                <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 mt-1 text-muted-foreground" />
                    <div className="flex-grow">
                        <p className="font-semibold text-accent">Prompt: <span className="font-normal text-foreground">{item.content.prompt}</span></p>
                        <Separator className="my-2" />
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.content.response}</p>
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

  const loreItems = savedItems.filter(item => item.type === 'lore');
  const otherItems = savedItems.filter(item => item.type !== 'lore');
  
  return (
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
                <Save className="h-6 w-6 text-accent" />
                Saved Items
              </CardTitle>
              <CardDescription>Your saved logs, messages, and lore timeline.</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
              {savedItems.length > 0 && (
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4"/> Clear All
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete all {savedItems.length} saved items. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={clearAllItems}>
                          Yes, Clear All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
              )}
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
        <ScrollArea className="h-full pr-4">
          {savedItems.length > 0 ? (
            <div className="space-y-4">
                {loreItems.length > 0 && (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={loreItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-3">
                                <h4 className="font-semibold text-lg text-accent">Galactic Timeline</h4>
                                {loreItems.map(item => (
                                    <SortableLoreItem key={item.id} item={item} removeItem={removeItem}>
                                        {renderItemContent(item)}
                                    </SortableLoreItem>
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}

                {otherItems.length > 0 && (
                    <div className="space-y-3">
                        {loreItems.length > 0 && <Separator />}
                        <h4 className="font-semibold text-lg">Pinned Items</h4>
                        {otherItems.map(item => (
                            <div key={item.id} className="flex items-start gap-2 rounded-lg border p-3">
                                <div className="flex-grow">{renderItemContent(item)}</div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeItem(item.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Save className="h-10 w-10 mb-4" />
              <p className="font-semibold">No Saved Items</p>
              <p className="text-sm">Click the save icon on logs or messages to keep them here.</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
