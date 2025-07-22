
"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DraggableModuleProps {
  id: string;
  activeId: string | null;
  children: React.ReactNode;
}

export function DraggableModule({ id, activeId, children }: DraggableModuleProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });
  
  const isDragging = activeId === id;

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1, // Hide the original component when dragging
  };

  // Clone the children and pass down the listeners for the drag handle
  const childrenWithProps = React.cloneElement(children as React.ReactElement, {
    dragHandleProps: listeners,
  });

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {childrenWithProps}
    </div>
  );
}
