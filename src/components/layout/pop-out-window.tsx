"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface PopOutWindowProps {
  children: React.ReactNode;
  onClose: () => void;
  setWindowInstance: (window: Window) => void; // Callback to pass window instance to parent
  size?: 'half' | 'quarter';
}

export function PopOutWindow({ children, onClose, setWindowInstance, size = 'quarter' }: PopOutWindowProps) {
  const windowRef = useRef<Window | null>(null);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Calculate window size based on the prop
    let popoutWidth, popoutHeight;
    const { width, height, availLeft, availTop } = window.screen;

    if (size === 'half') {
      popoutWidth = width / 2;
      popoutHeight = height;
    } else { // quarter
      popoutWidth = width / 2;
      popoutHeight = height / 2;
    }
    
    const newWindow = window.open(
      "", 
      "", // Giving a name can cause all popouts to share a window, blank opens new ones
      `width=${popoutWidth},height=${popoutHeight},left=${width / 2},top=${availTop},resizable,scrollbars`
    );
    
    if (newWindow) {
      windowRef.current = newWindow;
      setWindowInstance(newWindow); // Pass instance to parent
      const div = newWindow.document.createElement('div');
      newWindow.document.body.appendChild(div);
      newWindow.document.body.style.margin = '0';
      newWindow.document.documentElement.style.height = '100%';
      newWindow.document.body.style.height = '100%';
      div.style.height = '100%';
      newWindow.document.title = "Nexus Hub Module";

      // Copy stylesheets from main window to pop-out
      const styleSheets = Array.from(document.styleSheets);
      styleSheets.forEach(styleSheet => {
        try {
            if (styleSheet.cssRules) {
                const newStyleEl = newWindow.document.createElement('style');
                Array.from(styleSheet.cssRules).forEach(rule => {
                    newStyleEl.appendChild(newWindow.document.createTextNode(rule.cssText));
                });
                newWindow.document.head.appendChild(newStyleEl);
            } else if (styleSheet.href) {
                const newLinkEl = newWindow.document.createElement('link');
                newLinkEl.rel = 'stylesheet';
                newLinkEl.href = styleSheet.href;
                newWindow.document.head.appendChild(newLinkEl);
            }
        } catch (e) {
            console.warn('Could not copy stylesheet to pop-out window:', e);
        }
      });
      
      // Copy the class names from the html element to apply dark/light mode
      newWindow.document.documentElement.className = document.documentElement.className;
      
      newWindow.addEventListener('beforeunload', onClose);
      setContainer(div); // Trigger re-render with the container
    }

    return () => {
      if (windowRef.current) {
        windowRef.current.removeEventListener('beforeunload', onClose);
        windowRef.current.close();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // We need to render the children into the container once it's available
  return container ? createPortal(<div className="h-full bg-background text-foreground p-4">{children}</div>, container) : null;
}
