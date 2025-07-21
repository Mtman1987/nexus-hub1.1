"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, Trash2, Bot, User, BookText } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { PopOutButton } from './pop-out-button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from '../ui/badge';

export type SavedItem = {
  id: string;
  type: 'log' | 'chat';
  content: any;
  savedAt: string;
};

interface SavedItemsProps {
  onPopOut?: () => void;
  isPoppedOut?: boolean;
}

const STORAGE_KEY = 'nexus-saved-items';

export function SavedItems({ onPopOut, isPoppedOut = false }: SavedItemsProps) {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const { toast } = useToast();

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
    window.addEventListener('storage', loadItems); // Listen for changes from other tabs/windows
    return () => {
      window.removeEventListener('storage', loadItems);
    };
  }, [loadItems]);

  const removeItem = (id: string) => {
    const newItems = savedItems.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    setSavedItems(newItems); // Immediately update UI
    toast({ title: "Item Removed", description: "The saved item has been deleted." });
  };
  
  const clearAllItems = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSavedItems([]);
    toast({ title: "All Items Cleared", description: "All saved items have been deleted.", variant: "destructive" });
  };

  const renderItemContent = (item: SavedItem) => {
    if (item.type === 'log') {
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
    }
    if (item.type === 'chat') {
       return (
        <div className="flex items-start gap-3">
             {item.content.sender === 'ai' ? <Bot className="h-5 w-5 mt-1 text-accent" /> : <User className="h-5 w-5 mt-1" />}
            <div className="flex-grow">
                <p className="text-sm">{item.content.text}</p>
            </div>
        </div>
      );
    }
    return <p>Unknown item type</p>;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-grow">
            <CardTitle className="flex items-center gap-2">
              <Save className="h-6 w-6 text-accent" />
              Saved Items
            </CardTitle>
            <CardDescription>A collection of your pinned logs and messages.</CardDescription>
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
             {!isPoppedOut && onPopOut && <PopOutButton onClick={onPopOut} />}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full pr-4">
          {savedItems.length > 0 ? (
            <div className="space-y-3">
              {savedItems.map(item => (
                <div key={item.id} className="flex items-start gap-2 rounded-lg border p-3">
                  <div className="flex-grow">{renderItemContent(item)}</div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeItem(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
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
