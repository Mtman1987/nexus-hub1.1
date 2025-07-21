
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface PopOutWindowProps {
  children: React.ReactNode;
  onClose: () => void;
  title?: string;
  screenPosition?: number; // 1: TL, 2: TR, 3: BL, 4: BR
}

export function PopOutWindow({ children, onClose, title = "Nexus Hub Module", screenPosition }: PopOutWindowProps) {
  const windowRef = useRef<Window | null>(null);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Define the dimensions for each quadrant
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const popoutWidth = Math.floor(screenWidth / 2);
    const popoutHeight = Math.floor(screenHeight / 2);

    let top = 0, left = 0;
    switch (screenPosition) {
        case 1: // Top-Left
            top = 0;
            left = 0;
            break;
        case 2: // Top-Right
            top = 0;
            left = popoutWidth;
            break;
        case 3: // Bottom-Left
            top = popoutHeight;
            left = 0;
            break;
        case 4: // Bottom-Right
            top = popoutHeight;
            left = popoutWidth;
            break;
        default: // Default to top-left if unspecified
            top = 0;
            left = 0;
            break;
    }

    const windowFeatures = `width=${popoutWidth},height=${popoutHeight},left=${left},top=${top},resizable,scrollbars`;
    
    const newWindow = window.open("", "", windowFeatures);
    
    if (newWindow) {
      windowRef.current = newWindow;
      const div = newWindow.document.createElement('div');
      newWindow.document.body.appendChild(div);
      newWindow.document.body.style.margin = '0';
      newWindow.document.documentElement.style.height = '100%';
      newWindow.document.body.style.height = '100%';
      div.style.height = '100%';
      newWindow.document.title = title;

      // Copy stylesheets
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
      
      // Copy the dark/light mode class
      newWindow.document.documentElement.className = document.documentElement.className;
      
      newWindow.addEventListener('beforeunload', onClose);
      setContainer(div);
    }

    return () => {
      if (windowRef.current) {
        windowRef.current.removeEventListener('beforeunload', onClose);
        windowRef.current.close();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!container) {
    return null;
  }
  
  return createPortal(<div className="h-full bg-background text-foreground p-4">{children}</div>, container);
}

    