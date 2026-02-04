import { useEffect } from 'react';

export const DisableDevTools = () => {
  useEffect(() => {
    // if (import.meta.env.PROD) {
    //   // Disable right-click context menu
    //   const handleContextMenu = (e: MouseEvent) => {
    //     e.preventDefault();
    //     return false;
    //   };

    //   // Disable dev tools shortcuts
    //   const handleKeyDown = (e: KeyboardEvent) => {
    //     // F12
    //     if (e.key === 'F12') {
    //       e.preventDefault();
    //       return false;
    //     }
        
    //     // Ctrl+Shift+I (Inspector)
    //     if (e.ctrlKey && e.shiftKey && e.key === 'I') {
    //       e.preventDefault();
    //       return false;
    //     }
        
    //     // Ctrl+Shift+J (Console)
    //     if (e.ctrlKey && e.shiftKey && e.key === 'J') {
    //       e.preventDefault();
    //       return false;
    //     }
        
    //     // Ctrl+U (View Source)
    //     if (e.ctrlKey && e.key === 'u') {
    //       e.preventDefault();
    //       return false;
    //     }
        
    //     // Ctrl+Shift+C (Select Element)
    //     if (e.ctrlKey && e.shiftKey && e.key === 'C') {
    //       e.preventDefault();
    //       return false;
    //     }
    //   };

    //   // Disable text selection
    //   const handleSelectStart = (e: Event) => {
    //     e.preventDefault();
    //     return false;
    //   };

    //   // Disable drag
    //   const handleDragStart = (e: Event) => {
    //     e.preventDefault();
    //     return false;
    //   };

    //   document.addEventListener('contextmenu', handleContextMenu);
    //   document.addEventListener('keydown', handleKeyDown);
    //   document.addEventListener('selectstart', handleSelectStart);
    //   document.addEventListener('dragstart', handleDragStart);

    //   // Cleanup
    //   return () => {
    //     document.removeEventListener('contextmenu', handleContextMenu);
    //     document.removeEventListener('keydown', handleKeyDown);
    //     document.removeEventListener('selectstart', handleSelectStart);
    //     document.removeEventListener('dragstart', handleDragStart);
    //   };
    // }
  }, []);
};