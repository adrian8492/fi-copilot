import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface SessionNotesProps {
  sessionId: number;
  initialNotes: string | null;
}

export function SessionNotes({ sessionId, initialNotes }: SessionNotesProps) {
  const [notes, setNotes] = useState(initialNotes || '');
  const [isSaved, setIsSaved] = useState(true);

  const updateNotesMutation = trpc.sessions.updateNotes.useMutation({
    onSuccess: () => {
      setIsSaved(true);
    },
  });

  useEffect(() => {
    if (!isSaved) {
      const timeout = setTimeout(() => {
        updateNotesMutation.mutate({ sessionId, notes });
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [notes, isSaved, sessionId, updateNotesMutation]);

  const handleNotesChange = (value: string) => {
    setNotes(value);
    setIsSaved(false);
  };

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-foreground font-medium">Session Notes</h3>
          {isSaved && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Check className="h-3 w-3" />
              Saved
            </div>
          )}
        </div>
        <textarea
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Add notes about this session..."
          className={cn(
            "w-full min-h-[120px] p-3 rounded-md resize-none",
            "bg-card border border-border text-foreground",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          )}
        />
      </CardContent>
    </Card>
  );
}

export default SessionNotes;
