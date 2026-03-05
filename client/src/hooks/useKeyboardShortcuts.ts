import { useEffect } from 'react';

interface UseKeyboardShortcutsProps {
  onToggleRecording?: () => void;
  onMarkUsed?: () => void;
  onDismissAlert?: () => void;
  onEndSession?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onToggleRecording,
  onMarkUsed,
  onDismissAlert,
  onEndSession,
  enabled = true,
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    if (!enabled) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      if (isCtrlOrCmd && event.key === 'Enter') {
        event.preventDefault();
        onToggleRecording?.();
        return;
      }
      if (isCtrlOrCmd && event.key === 'm') {
        event.preventDefault();
        onMarkUsed?.();
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        onDismissAlert?.();
        return;
      }
      if (isCtrlOrCmd && event.key === 'e') {
        event.preventDefault();
        onEndSession?.();
        return;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onToggleRecording, onMarkUsed, onDismissAlert, onEndSession, enabled]);
}
