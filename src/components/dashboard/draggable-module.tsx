
"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

interface DraggableModuleProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function DraggableModule({ id, children, className }: DraggableModuleProps) {
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
    gridColumn: isDragging ? 'span 1 / span 1' : undefined, // Prevent reflow issues during drag
  };

  // Clone the children and pass down the listeners for the drag handle
  const childrenWithProps = React.cloneElement(children as React.ReactElement, {
    dragHandleProps: { ...attributes, ...listeners },
  });

  return (
    <div ref={setNodeRef} style={style} className={cn(className, isDragging ? 'opacity-50' : 'opacity-100')}>
      {childrenWithProps}
    </div>
  );
}
