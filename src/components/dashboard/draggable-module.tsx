
"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

interface DraggableModuleProps {
  id: string;
  children: React.ReactNode;
}

export function DraggableModule({ id, children }: DraggableModuleProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  
  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  // Clone the children and pass down the listeners for the drag handle
  const childrenWithProps = React.cloneElement(children as React.ReactElement, {
    dragHandleProps: listeners,
  });

  return (
    <div ref={setNodeRef} style={style} {...attributes} className={cn(isDragging && 'opacity-0')}>
      {childrenWithProps}
    </div>
  );
}
