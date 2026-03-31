import { useState, useEffect, useMemo, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  BookOpen, CheckCircle2, Circle, ChevronDown, ChevronRight, GraduationCap, Award, Send, PartyPopper,
} from "lucide-react";

// ─── Types & Data ─────────────────────────────────────────────────────────────
export interface Lesson {
  id: string;
  title: string;
}

export interface TrainingModule {
  id: string;
  name: string;
  lessons: Lesson[];
}

export const CURRICULUM: TrainingModule[] = [
  {
    id: "m1", name: "The Menu Order System",
    lessons: [
      { id: "m1-l1", title: "Understanding the Menu Flow" },
      { id: "m1-l2", title: "Product Sequencing Strategy" },
      { id: "m1-l3", title: "Presentation Timing" },
      { id: "m1-l4", title: "Price Anchoring Techniques" },
    ],
  },
  {
    id: "m2", name: "The Upgrade Architecture",
    lessons: [
      { id: "m2-l1", title: "Coverage Tier Positioning" },
      { id: "m2-l2", title: "Upgrade vs. Base Framing" },
      { id: "m2-l3", title: "Building Value in Higher Tiers" },
    ],
  },
  {
    id: "m3", name: "The Objection Prevention Framework",
    lessons: [
      { id: "m3-l1", title: "Pre-Framing Techniques" },
      { id: "m3-l2", title: "Value Stacking Before the Ask" },
      { id: "m3-l3", title: "Emotional Anchors" },
      { id: "m3-l4", title: "Anticipating Common Objections" },
      { id: "m3-l5", title: "Turnaround Scripts" },
    ],
  },
  {
    id: "m4", name: "The Coaching Cadence",
    lessons: [
      { id: "m4-l1", title: "Daily Huddle Framework" },
      { id: "m4-l2", title: "Weekly One-on-One Structure" },
      { id: "m4-l3", title: "Monthly Review Playbook" },
    ],
  },
  {
    id: "m5", name: "Compliance Essentials",
    lessons: [
      { id: "m5-l1", title: "Federal Disclosure Requirements" },
      { id: "m5-l2", title: "State-Specific Regulations" },
      { id: "m5-l3", title: "Documentation Best Practices" },
      { id: "m5-l4", title: "Audit Readiness Checklist" },
    ],
  },
  {
    id: "m6", name: "Advanced Closing Techniques",
    lessons: [
      { id: "m6-l1", title: "The Assumptive Close" },
      { id: "m6-l2", title: "Alternative Choice Close" },
      { id: "m6-l3", title: "Urgency & Scarcity Framing" },
    ],
  },
];

export const TOTAL_LESSONS = CURRICULUM.reduce((s, m) => s + m.lessons.length, 0);

export function getModuleCompletionPct(completedIds: Set<string>, mod: TrainingModule): number {
  const completed = mod.lessons.filter((l) => completedIds.has(l.id)).length;
  return Math.round((completed / mod.lessons.length) * 100);
}

export function getOverallProgress(completedIds: Set<string>): { completed: number; total: number; pct: number } {
  let completed = 0;
  for (const mod of CURRICULUM) {
    completed += mod.lessons.filter((l) => completedIds.has(l.id)).length;
  }
  return { completed, total: TOTAL_LESSONS, pct: Math.round((completed / TOTAL_LESSONS) * 100) };
}

export function getModuleStatus(completedIds: Set<string>, mod: TrainingModule): "Not Started" | "In Progress" | "Completed" {
  const count = mod.lessons.filter((l) => completedIds.has(l.id)).length;
  if (count === 0) return "Not Started";
  if (count === mod.lessons.length) return "Completed";
  return "In Progress";
}

function loadCompleted(): Set<string> {
  try {
    const raw = localStorage.getItem("asura-training-completed");
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveCompleted(ids: Set<string>) {
  localStorage.setItem("asura-training-completed", JSON.stringify(Array.from(ids)));
}

const STATUS_COLORS: Record<string, string> = {
  "Not Started": "border-border text-muted-foreground",
  "In Progress": "border-yellow-500/30 text-yellow-400 bg-yellow-500/10",
  "Completed": "border-green-500/30 text-green-400 bg-green-500/10",
};

const DEMO_MANAGERS = ["Sarah Johnson", "Mike Chen", "Lisa Rodriguez", "Tom Williams", "Amy Park"];

export default function TrainingCurriculum() {
  useEffect(() => { document.title = "Training Curriculum | F&I Co-Pilot by ASURA Group"; }, []);
  const [completedIds, setCompletedIds] = useState<Set<string>>(loadCompleted);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignManager, setAssignManager] = useState("");
  const [assignModule, setAssignModule] = useState("");

  const progress = useMemo(() => getOverallProgress(completedIds), [completedIds]);

  const toggleLesson = useCallback((lessonId: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(lessonId)) next.delete(lessonId);
      else next.add(lessonId);
      saveCompleted(next);
      return next;
    });
  }, []);

  const toggleExpand = useCallback((modId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(modId)) next.delete(modId);
      else next.add(modId);
      return next;
    });
  }, []);

  const handleAssign = () => {
    if (!assignManager || !assignModule) { toast.error("Select a manager and module"); return; }
    toast.success(`Assigned "${CURRICULUM.find((m) => m.id === assignModule)?.name}" to ${assignManager}`);
    setAssignOpen(false);
    setAssignManager("");
    setAssignModule("");
  };

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (progress.pct / 100) * circumference;

  return (
    <AppLayout title="Training Curriculum" subtitle="ASURA OPS training module progress">
      <div className="p-4 sm:p-6 space-y-6">
        {/* Top Section: Progress Ring + Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Progress Ring */}
          <div className="relative w-28 h-28 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="hsl(var(--border))" strokeWidth="8" fill="none" />
              <circle
                cx="50" cy="50" r="40"
                stroke={progress.pct === 100 ? "#22c55e" : "#6366f1"}
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-xl font-bold text-foreground">{progress.pct}%</p>
              <p className="text-[10px] text-muted-foreground">{progress.completed}/{progress.total}</p>
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-lg font-bold text-foreground">
              {progress.pct === 100 ? "Training Complete!" : `${progress.completed} of ${progress.total} lessons completed`}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {progress.pct === 100
                ? "All ASURA OPS training modules have been completed."
                : `${progress.total - progress.completed} lessons remaining across ${CURRICULUM.length} modules`}
            </p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => setAssignOpen(true)}>
            <Send className="w-4 h-4" />
            Assign Training
          </Button>
        </div>

        {/* Celebration Card */}
        {progress.pct === 100 && (
          <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
            <CardContent className="p-6 text-center">
              <PartyPopper className="w-10 h-10 text-green-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-green-400 mb-1">Training Complete 🎉</h3>
              <p className="text-sm text-muted-foreground">
                Congratulations! All ASURA OPS training modules have been completed. Certificate of completion earned.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Module Cards */}
        <div className="space-y-4">
          {CURRICULUM.map((mod) => {
            const pct = getModuleCompletionPct(completedIds, mod);
            const status = getModuleStatus(completedIds, mod);
            const isExpanded = expanded.has(mod.id);
            const completedCount = mod.lessons.filter((l) => completedIds.has(l.id)).length;

            return (
              <Card key={mod.id} className="bg-card border-border">
                <CardContent className="p-0">
                  {/* Module Header */}
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-accent/30 transition-colors"
                    onClick={() => toggleExpand(mod.id)}
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                    <BookOpen className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-foreground">{mod.name}</h3>
                        <Badge variant="outline" className={cn("text-[10px]", STATUS_COLORS[status])}>{status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{completedCount}/{mod.lessons.length} lessons • {pct}% complete</p>
                    </div>
                    {/* Mini progress bar */}
                    <div className="w-24 h-2 rounded-full bg-border overflow-hidden shrink-0 hidden sm:block">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", pct === 100 ? "bg-green-500" : pct > 0 ? "bg-primary" : "")}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Expanded Lessons */}
                  {isExpanded && (
                    <div className="border-t border-border px-4 py-2 space-y-1">
                      {mod.lessons.map((lesson) => {
                        const done = completedIds.has(lesson.id);
                        return (
                          <div
                            key={lesson.id}
                            className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-accent/30 cursor-pointer transition-colors"
                            onClick={() => toggleLesson(lesson.id)}
                          >
                            {done
                              ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                              : <Circle className="w-4 h-4 text-muted-foreground shrink-0" />}
                            <span className={cn("text-sm", done ? "text-muted-foreground line-through" : "text-foreground")}>{lesson.title}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Assign Training Modal */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Training Module</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Manager</p>
              <Select value={assignManager} onValueChange={setAssignManager}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Select manager..." />
                </SelectTrigger>
                <SelectContent>
                  {DEMO_MANAGERS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Module</p>
              <Select value={assignModule} onValueChange={setAssignModule}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Select module..." />
                </SelectTrigger>
                <SelectContent>
                  {CURRICULUM.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setAssignOpen(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleAssign}>Assign</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
