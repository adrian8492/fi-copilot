import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Tag, Plus, X, Star, StickyNote, AlertTriangle, Zap, Heart, Shield, PhoneForwarded, MessageSquare,
} from "lucide-react";

// ─── Types & Constants ────────────────────────────────────────────────────────
export const PREDEFINED_TAGS = [
  { name: "Hot Lead", color: "border-red-500/30 text-red-400 bg-red-500/10" },
  { name: "Follow Up", color: "border-blue-500/30 text-blue-400 bg-blue-500/10" },
  { name: "Coaching Moment", color: "border-yellow-500/30 text-yellow-400 bg-yellow-500/10" },
  { name: "Great Close", color: "border-green-500/30 text-green-400 bg-green-500/10" },
  { name: "Compliance Issue", color: "border-orange-500/30 text-orange-400 bg-orange-500/10" },
  { name: "Escalation", color: "border-purple-500/30 text-purple-400 bg-purple-500/10" },
] as const;

export const TAG_COLOR_MAP: Record<string, string> = {};
for (const t of PREDEFINED_TAGS) TAG_COLOR_MAP[t.name] = t.color;

export function getTagColor(tagName: string): string {
  return TAG_COLOR_MAP[tagName] ?? "border-border text-muted-foreground bg-muted/30";
}

export function getStorageKey(sessionId: string): string {
  return `asura-session-tags-${sessionId}`;
}

export function getNotesKey(sessionId: string): string {
  return `asura-session-notes-${sessionId}`;
}

interface TagData {
  tags: string[];
  notes: string;
  pinnedNotes: string[];
}

function loadTagData(sessionId: string): TagData {
  try {
    const raw = localStorage.getItem(getStorageKey(sessionId));
    if (raw) return JSON.parse(raw);
  } catch {}
  return { tags: [], notes: "", pinnedNotes: [] };
}

function saveTagData(sessionId: string, data: TagData) {
  localStorage.setItem(getStorageKey(sessionId), JSON.stringify(data));
}

export function getSessionTagCount(sessionId: string): number {
  try {
    const raw = localStorage.getItem(getStorageKey(sessionId));
    if (raw) {
      const data = JSON.parse(raw);
      return data.tags?.length ?? 0;
    }
  } catch {}
  return 0;
}

export function sessionMatchesTags(sessionId: string, filterTags: string[]): boolean {
  if (filterTags.length === 0) return true;
  try {
    const raw = localStorage.getItem(getStorageKey(sessionId));
    if (raw) {
      const data = JSON.parse(raw);
      const sessionTags: string[] = data.tags ?? [];
      return filterTags.some((ft) => sessionTags.includes(ft));
    }
  } catch {}
  return false;
}

export function sortPinnedFirst(notes: string[], pinnedNotes: string[]): string[] {
  const pinned = notes.filter((n) => pinnedNotes.includes(n));
  const unpinned = notes.filter((n) => !pinnedNotes.includes(n));
  return [...pinned, ...unpinned];
}

interface SessionTagsProps {
  sessionId: string;
}

export default function SessionTags({ sessionId }: SessionTagsProps) {
  const [data, setData] = useState<TagData>(() => loadTagData(sessionId));
  const [customTag, setCustomTag] = useState("");
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [noteInput, setNoteInput] = useState("");

  useEffect(() => {
    setData(loadTagData(sessionId));
  }, [sessionId]);

  const updateData = useCallback((updater: (prev: TagData) => TagData) => {
    setData((prev) => {
      const next = updater(prev);
      saveTagData(sessionId, next);
      return next;
    });
  }, [sessionId]);

  const addTag = useCallback((tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    updateData((prev) => {
      if (prev.tags.includes(trimmed)) return prev;
      return { ...prev, tags: [...prev.tags, trimmed] };
    });
    setCustomTag("");
    setShowTagPicker(false);
  }, [updateData]);

  const removeTag = useCallback((tag: string) => {
    updateData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  }, [updateData]);

  const updateNotes = useCallback((notes: string) => {
    updateData((prev) => ({ ...prev, notes }));
  }, [updateData]);

  const togglePinNote = useCallback((note: string) => {
    updateData((prev) => {
      const isPinned = prev.pinnedNotes.includes(note);
      return {
        ...prev,
        pinnedNotes: isPinned
          ? prev.pinnedNotes.filter((n) => n !== note)
          : [...prev.pinnedNotes, note],
      };
    });
  }, [updateData]);

  const availableTags = PREDEFINED_TAGS.filter((t) => !data.tags.includes(t.name));

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm font-semibold">Tags & Notes</CardTitle>
          {data.tags.length > 0 && (
            <Badge variant="outline" className="text-[10px] ml-auto">{data.tags.length} tags</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tags */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {data.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className={cn("text-xs gap-1 cursor-pointer hover:opacity-70 transition-opacity", getTagColor(tag))}
                onClick={() => removeTag(tag)}
              >
                {tag}
                <X className="w-3 h-3" />
              </Badge>
            ))}
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-xs gap-1 px-2"
              onClick={() => setShowTagPicker(!showTagPicker)}
            >
              <Plus className="w-3 h-3" />
              Add
            </Button>
          </div>

          {showTagPicker && (
            <div className="p-3 rounded-lg border border-border bg-background space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {availableTags.map((t) => (
                  <Badge
                    key={t.name}
                    variant="outline"
                    className={cn("text-xs cursor-pointer hover:opacity-70 transition-opacity", t.color)}
                    onClick={() => addTag(t.name)}
                  >
                    + {t.name}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Custom tag..."
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addTag(customTag); }}
                  className="h-7 text-xs bg-background border-border"
                />
                <Button size="sm" className="h-7 text-xs" onClick={() => addTag(customTag)} disabled={!customTag.trim()}>
                  Add
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <StickyNote className="w-3 h-3" /> Session Notes
          </p>
          <Textarea
            placeholder="Add notes about this session..."
            value={data.notes}
            onChange={(e) => updateNotes(e.target.value)}
            className="bg-background border-border resize-none text-xs min-h-[80px]"
          />

          {/* Pinned Notes */}
          {data.pinnedNotes.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-yellow-400 flex items-center gap-1">
                <Star className="w-3 h-3" /> Pinned Notes
              </p>
              {data.pinnedNotes.map((note) => (
                <div
                  key={note}
                  className="flex items-start gap-2 p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/20 cursor-pointer"
                  onClick={() => togglePinNote(note)}
                >
                  <Star className="w-3 h-3 text-yellow-400 mt-0.5 shrink-0 fill-yellow-400" />
                  <p className="text-xs text-foreground">{note}</p>
                </div>
              ))}
            </div>
          )}

          {/* Pin current note */}
          {data.notes.trim() && !data.pinnedNotes.includes(data.notes.trim()) && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-[10px] gap-1 text-yellow-400"
              onClick={() => togglePinNote(data.notes.trim())}
            >
              <Star className="w-3 h-3" /> Pin this note
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
