import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Calendar, Clock, Star, AlertTriangle, Plus, Trash2, Copy, UserCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const SESSION_TYPES = ["Weekly Check-In", "Monthly Review", "Performance Improvement", "Training Session", "Goal Setting"] as const;

interface CoachingSession {
  id: string;
  managerId: string;
  type: string;
  date: string;
  notes: string;
  agenda: string[];
  rating: number;
  takeaways: string;
  actionItems: string[];
  followUpDate: string;
}

const MANAGERS = [
  { id: "m1", name: "Marcus Rivera", coachingScore: 82, lastCoached: "2026-04-10" },
  { id: "m2", name: "Jessica Chen", coachingScore: 91, lastCoached: "2026-04-15" },
  { id: "m3", name: "David Washington", coachingScore: 68, lastCoached: "2026-03-20" },
  { id: "m4", name: "Sarah Kim", coachingScore: 88, lastCoached: "2026-04-12" },
  { id: "m5", name: "James Patterson", coachingScore: 55, lastCoached: "2026-03-15" },
  { id: "m6", name: "Maria Lopez", coachingScore: 94, lastCoached: "2026-04-16" },
  { id: "m7", name: "Robert Taylor", coachingScore: 72, lastCoached: "2026-03-25" },
  { id: "m8", name: "Amanda Foster", coachingScore: 78, lastCoached: "2026-04-08" },
];

const DEMO_HISTORY: CoachingSession[] = [
  { id: "h1", managerId: "m1", type: "Weekly Check-In", date: "2026-04-10", notes: "Reviewed GAP penetration strategy", agenda: ["GAP numbers", "Menu presentation"], rating: 4, takeaways: "Needs work on objection handling", actionItems: ["Practice rebuttals", "Shadow top performer"], followUpDate: "2026-04-17" },
  { id: "h2", managerId: "m1", type: "Monthly Review", date: "2026-03-28", notes: "PVR trending up", agenda: ["Monthly metrics", "Goal review"], rating: 3, takeaways: "Good improvement on VSC", actionItems: ["Increase tire & wheel focus"], followUpDate: "2026-04-10" },
  { id: "h3", managerId: "m1", type: "Training Session", date: "2026-03-15", notes: "Menu order system training", agenda: ["Training module", "Role play"], rating: 5, takeaways: "Excellent engagement", actionItems: ["Apply new techniques"], followUpDate: "2026-03-28" },
  { id: "h4", managerId: "m2", type: "Weekly Check-In", date: "2026-04-15", notes: "Top performer review", agenda: ["Numbers review", "Best practices share"], rating: 5, takeaways: "Consistent excellence", actionItems: ["Mentor junior staff"], followUpDate: "2026-04-22" },
  { id: "h5", managerId: "m2", type: "Goal Setting", date: "2026-04-01", notes: "Q2 goal alignment", agenda: ["Q2 targets", "Development plan"], rating: 4, takeaways: "Ambitious but achievable goals", actionItems: ["Track weekly progress"], followUpDate: "2026-04-15" },
  { id: "h6", managerId: "m3", type: "Performance Improvement", date: "2026-03-20", notes: "Addressing declining PVR", agenda: ["PVR analysis", "Action plan"], rating: 2, takeaways: "Needs significant improvement", actionItems: ["Daily coaching", "Script adherence"], followUpDate: "2026-03-27" },
  { id: "h7", managerId: "m5", type: "Performance Improvement", date: "2026-03-15", notes: "Low product penetration", agenda: ["Penetration review", "Remediation"], rating: 2, takeaways: "Struggling with menu presentation", actionItems: ["Re-training", "Daily roleplay"], followUpDate: "2026-03-22" },
  { id: "h8", managerId: "m7", type: "Weekly Check-In", date: "2026-03-25", notes: "New hire progress check", agenda: ["Onboarding progress", "Questions"], rating: 3, takeaways: "Learning quickly but needs more reps", actionItems: ["Shadow sessions", "Study word tracks"], followUpDate: "2026-04-01" },
];

function daysBetween(d1: string, d2: string) {
  return Math.round((new Date(d2).getTime() - new Date(d1).getTime()) / 86400000);
}

function getStorageKey(managerId: string) {
  return `fi-copilot-coaching-${managerId}`;
}

function loadSessions(managerId: string): CoachingSession[] {
  try {
    const raw = localStorage.getItem(getStorageKey(managerId));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveSessions(managerId: string, sessions: CoachingSession[]) {
  localStorage.setItem(getStorageKey(managerId), JSON.stringify(sessions));
}

export default function CoachingPlanner() {
  useEffect(() => { document.title = "Coaching Session Planner | F&I Co-Pilot by ASURA Group"; }, []);

  const [selectedMgr, setSelectedMgr] = useState(MANAGERS[0].id);
  const [sessionType, setSessionType] = useState<string>(SESSION_TYPES[0]);
  const [scheduledDate, setScheduledDate] = useState("");
  const [agenda, setAgenda] = useState<string[]>(["Review metrics", "Discuss focus areas"]);
  const [newAgendaItem, setNewAgendaItem] = useState("");
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState(0);
  const [takeaways, setTakeaways] = useState("");
  const [actionItems, setActionItems] = useState<string[]>([]);
  const [newAction, setNewAction] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [calMonth, setCalMonth] = useState(3); // 0-indexed, 3 = April
  const [calYear, setCalYear] = useState(2026);

  const today = "2026-04-18";
  const manager = MANAGERS.find((m) => m.id === selectedMgr)!;
  const daysSinceCoached = daysBetween(manager.lastCoached, today);
  const isDue = daysSinceCoached > 14;
  const isOverdue = daysSinceCoached > 21;

  const overdueManagers = MANAGERS.filter((m) => daysBetween(m.lastCoached, today) > 21);

  const allHistory = useMemo(() => {
    const demo = DEMO_HISTORY.filter((h) => h.managerId === selectedMgr);
    const saved = loadSessions(selectedMgr);
    return [...demo, ...saved].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [selectedMgr]);

  const avgCadence = useMemo(() => {
    const mgrs = MANAGERS.map((m) => daysBetween(m.lastCoached, today));
    return Math.round(mgrs.reduce((s, d) => s + d, 0) / mgrs.length);
  }, []);

  const prepMetrics = useMemo(() => {
    const m = manager;
    return [
      `Coaching Score: ${m.coachingScore}%`,
      `Days Since Last Session: ${daysSinceCoached}`,
      `Status: ${isOverdue ? "OVERDUE" : isDue ? "Due Soon" : "On Track"}`,
    ];
  }, [selectedMgr, daysSinceCoached]);

  const addAgendaItem = useCallback(() => {
    if (newAgendaItem.trim()) { setAgenda((a) => [...a, newAgendaItem.trim()]); setNewAgendaItem(""); }
  }, [newAgendaItem]);

  const removeAgendaItem = useCallback((idx: number) => {
    setAgenda((a) => a.filter((_, i) => i !== idx));
  }, []);

  const addActionItem = useCallback(() => {
    if (newAction.trim()) { setActionItems((a) => [...a, newAction.trim()]); setNewAction(""); }
  }, [newAction]);

  const handleSave = () => {
    const session: CoachingSession = {
      id: `s-${Date.now()}`,
      managerId: selectedMgr,
      type: sessionType,
      date: scheduledDate || today,
      notes,
      agenda,
      rating,
      takeaways,
      actionItems,
      followUpDate: followUp,
    };
    const existing = loadSessions(selectedMgr);
    saveSessions(selectedMgr, [...existing, session]);
    setNotes(""); setRating(0); setTakeaways(""); setActionItems([]); setFollowUp("");
  };

  const exportNotes = async () => {
    const lines = [
      `Coaching Session: ${manager.name}`,
      `Type: ${sessionType}`,
      `Date: ${scheduledDate || today}`,
      "",
      "Agenda:",
      ...agenda.map((a) => `  - ${a}`),
      "",
      `Notes: ${notes}`,
      `Rating: ${rating}/5`,
      `Takeaways: ${takeaways}`,
      "",
      "Action Items:",
      ...actionItems.map((a) => `  - ${a}`),
      `Follow-up: ${followUp}`,
    ];
    const text = lines.join("\n");

    // 1. Try clipboard copy (with graceful fallback)
    let copied = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        copied = true;
      } else {
        // Fallback for non-secure contexts (e.g. http://)
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try {
          copied = document.execCommand("copy");
        } catch {
          copied = false;
        }
        document.body.removeChild(ta);
      }
    } catch {
      copied = false;
    }

    // 2. Always also download as .txt so the user has a real artifact
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const fname = `coaching-${manager.name.replace(/\s+/g, "-").toLowerCase()}-${(scheduledDate || today).slice(0, 10)}.txt`;
    a.href = url;
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // 3. Toast confirmation
    if (copied) {
      toast.success("Notes copied + downloaded", {
        description: `${fname} — also on your clipboard`,
      });
    } else {
      toast.success("Notes downloaded", {
        description: `${fname} (clipboard unavailable)`,
      });
    }
  };

  // Calendar grid
  const calDays = useMemo(() => {
    const first = new Date(calYear, calMonth, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells: (number | null)[] = Array(startDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7) cells.push(null);
    return cells;
  }, [calMonth, calYear]);

  const sessionDates = useMemo(() => {
    const dates = new Set<number>();
    [...DEMO_HISTORY, ...loadSessions(selectedMgr)].forEach((s) => {
      const d = new Date(s.date);
      if (d.getMonth() === calMonth && d.getFullYear() === calYear) dates.add(d.getDate());
    });
    return dates;
  }, [calMonth, calYear, selectedMgr]);

  const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <AppLayout title="Coaching Session Planner" subtitle="Plan, track, and review coaching sessions">
      <div className="p-6 space-y-6">
        {/* Overdue Alert */}
        {overdueManagers.length > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-500">Overdue Coaching Sessions</p>
              <p className="text-xs text-muted-foreground mt-1">
                {overdueManagers.map((m) => `${m.name} (${daysBetween(m.lastCoached, today)} days)`).join(", ")}
              </p>
            </div>
          </div>
        )}

        {/* Cadence KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-4 pb-3 text-center"><p className="text-xs text-muted-foreground">Avg Days Between Sessions</p><p className={`text-2xl font-bold ${avgCadence <= 14 ? "text-green-500" : "text-amber-500"}`}>{avgCadence}</p><p className="text-xs text-muted-foreground">Target: ≤ 14 days</p></CardContent></Card>
          <Card><CardContent className="pt-4 pb-3 text-center"><p className="text-xs text-muted-foreground">Managers Overdue</p><p className="text-2xl font-bold text-red-500">{overdueManagers.length}</p><p className="text-xs text-muted-foreground">21+ days since coaching</p></CardContent></Card>
          <Card><CardContent className="pt-4 pb-3 text-center"><p className="text-xs text-muted-foreground">Due for Coaching</p><p className="text-2xl font-bold text-amber-500">{MANAGERS.filter((m) => daysBetween(m.lastCoached, today) > 14).length}</p><p className="text-xs text-muted-foreground">14+ days since coaching</p></CardContent></Card>
          <Card><CardContent className="pt-4 pb-3 text-center"><p className="text-xs text-muted-foreground">Total Managers</p><p className="text-2xl font-bold">{MANAGERS.length}</p></CardContent></Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel: Manager List */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Managers</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {MANAGERS.map((m) => {
                const days = daysBetween(m.lastCoached, today);
                const due = days > 14;
                const overdue = days > 21;
                return (
                  <button
                    key={m.id}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${selectedMgr === m.id ? "bg-primary/10 border border-primary/20" : "hover:bg-accent"}`}
                    onClick={() => setSelectedMgr(m.id)}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{m.name}</p>
                      {overdue && <Badge variant="outline" className="text-[10px] text-red-500 border-red-500/30">Overdue</Badge>}
                      {due && !overdue && <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30">Due</Badge>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>Score: {m.coachingScore}%</span>
                      <span>Last: {m.lastCoached}</span>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Right Panel: Session Planner */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pre-session Prep */}
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><UserCheck className="w-4 h-4" />Pre-Session Prep: {manager.name}</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {prepMetrics.map((m, i) => (
                    <div key={i} className="p-2 rounded bg-accent/50 text-xs text-center">{m}</div>
                  ))}
                </div>
                {allHistory.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium mb-1">Last session notes:</p>
                    <p>{allHistory[0].notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Session Form */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Session Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Session Type</Label>
                    <Select value={sessionType} onValueChange={setSessionType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{SESSION_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Scheduled Date</Label>
                    <Input type="datetime-local" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
                  </div>
                </div>

                {/* Agenda */}
                <div>
                  <Label>Agenda Items</Label>
                  <div className="space-y-1 mt-1">
                    {agenda.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-sm flex-1 p-2 rounded bg-accent/50">{item}</span>
                        <button onClick={() => removeAgendaItem(i)} className="text-muted-foreground hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input value={newAgendaItem} onChange={(e) => setNewAgendaItem(e.target.value)} placeholder="Add agenda item" onKeyDown={(e) => e.key === "Enter" && addAgendaItem()} />
                      <Button variant="outline" size="sm" onClick={addAgendaItem}><Plus className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label>Session Notes</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                </div>

                {/* Post-session */}
                <div className="border-t border-border pt-4 space-y-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Post-Session</p>
                  <div>
                    <Label>Rating</Label>
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} onClick={() => setRating(s)} className={`p-1 ${s <= rating ? "text-amber-400" : "text-muted-foreground/30"}`}>
                          <Star className="w-5 h-5" fill={s <= rating ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Key Takeaways</Label>
                    <Textarea value={takeaways} onChange={(e) => setTakeaways(e.target.value)} rows={2} />
                  </div>
                  <div>
                    <Label>Action Items</Label>
                    <div className="space-y-1 mt-1">
                      {actionItems.map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-sm flex-1 p-2 rounded bg-accent/50">{item}</span>
                          <button onClick={() => setActionItems((a) => a.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Input value={newAction} onChange={(e) => setNewAction(e.target.value)} placeholder="Add action item" onKeyDown={(e) => e.key === "Enter" && addActionItem()} />
                        <Button variant="outline" size="sm" onClick={addActionItem}><Plus className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label>Follow-up Date</Label>
                    <Input type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSave}>Save Session</Button>
                  <Button variant="outline" onClick={exportNotes}><Copy className="w-4 h-4 mr-1" />Export Notes</Button>
                </div>
              </CardContent>
            </Card>

            {/* Calendar */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2"><Calendar className="w-4 h-4" />Coaching Calendar</CardTitle>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); }}><ChevronLeft className="w-4 h-4" /></button>
                    <span className="text-sm font-medium">{MONTH_NAMES[calMonth]} {calYear}</span>
                    <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); }}><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div key={d} className="text-muted-foreground py-1 font-medium">{d}</div>
                  ))}
                  {calDays.map((day, i) => (
                    <div key={i} className={`py-2 rounded relative ${day ? "hover:bg-accent" : ""}`}>
                      {day && (
                        <>
                          <span className="text-sm">{day}</span>
                          {sessionDates.has(day) && <div className="w-1.5 h-1.5 rounded-full bg-primary mx-auto mt-0.5" />}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Session History */}
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Clock className="w-4 h-4" />Session History: {manager.name}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {allHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sessions recorded yet.</p>
                ) : allHistory.map((s) => (
                  <div key={s.id} className="p-3 rounded-lg bg-accent/50">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{s.type}</Badge>
                        <span className="text-xs text-muted-foreground">{s.date}</span>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((v) => (
                          <Star key={v} className={`w-3 h-3 ${v <= s.rating ? "text-amber-400" : "text-muted-foreground/20"}`} fill={v <= s.rating ? "currentColor" : "none"} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{s.takeaways}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
