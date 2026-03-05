import { X, Keyboard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const mod = isMac ? '⌘' : 'Ctrl';

const shortcuts = [
  { keys: `${mod} + Enter`, label: "Toggle Recording" },
  { keys: `${mod} + M`, label: "Mark Word Track as Used" },
  { keys: "Escape", label: "Dismiss Alert Banner" },
  { keys: `${mod} + E`, label: "End Session" },
];

export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <Card className="bg-card border-border w-[420px]" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Keyboard className="w-4 h-4" /> Keyboard Shortcuts
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {shortcuts.map((s) => (
            <div key={s.keys} className="flex items-center justify-between">
              <span className="text-sm text-foreground">{s.label}</span>
              <Badge variant="outline" className="font-mono text-xs">{s.keys}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
