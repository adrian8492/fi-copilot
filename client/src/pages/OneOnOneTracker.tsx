import { useState, useMemo, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  ChevronDown,
  ChevronRight,
  ListTodo,
  Users,
  X,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────
interface ActionItem {
  id: string;
  text: string;
  assignee: string;
  dueDate: string;
  completed: boolean;
  meetingId: string;
}

interface Meeting {
  id: string;
  managerName: string;
  trainerName: string;
  date: string;
  time: string;
  status: "Scheduled" | "Completed" | "Missed";
  topics: string[];
  agenda: string[];
  actionItems: ActionItem[];
  notes: string;
  followUpRequired: boolean;
  recurring: "none" | "weekly" | "biweekly" | "monthly";
  duration?: number; // minutes
}

const STORAGE_KEY = "fi-copilot-one-on-ones";

const MANAGERS = ["Marcus Rivera", "Jessica Chen", "David Park", "Sarah Kim"];
const TRAINERS = ["Coach Williams", "Coach Patel"];

// ── Demo Data ──────────────────────────────────────────────
function getDemoData(): Meeting[] {
  return [
    // 8 past meetings
    { id: "m1", managerName: "Marcus Rivera", trainerName: "Coach Williams", date: "2026-03-05", time: "10:00", status: "Completed", topics: ["PVR improvement", "Menu presentation"], agenda: ["Review last week's numbers", "Menu role-play"], actionItems: [{ id: "a1", text: "Practice 3-option close", assignee: "Marcus Rivera", dueDate: "2026-03-12", completed: true, meetingId: "m1" }], notes: "Good progress on menu presentation. PVR up 8% WoW.", followUpRequired: false, recurring: "weekly", duration: 30 },
    { id: "m2", managerName: "Jessica Chen", trainerName: "Coach Williams", date: "2026-03-06", time: "14:00", status: "Completed", topics: ["Objection handling"], agenda: ["Objection role-play", "Review recordings"], actionItems: [{ id: "a2", text: "Review ASURA objection word tracks", assignee: "Jessica Chen", dueDate: "2026-03-13", completed: true, meetingId: "m2" }], notes: "Needs work on Feel-Felt-Found technique.", followUpRequired: true, recurring: "weekly", duration: 25 },
    { id: "m3", managerName: "David Park", trainerName: "Coach Patel", date: "2026-03-10", time: "09:00", status: "Completed", topics: ["Compliance review"], agenda: ["TILA disclosure timing", "ECOA guidelines"], actionItems: [{ id: "a3", text: "Complete compliance module", assignee: "David Park", dueDate: "2026-03-17", completed: false, meetingId: "m3" }], notes: "Compliance scores need improvement. Scheduled follow-up.", followUpRequired: true, recurring: "biweekly", duration: 35 },
    { id: "m4", managerName: "Sarah Kim", trainerName: "Coach Patel", date: "2026-03-12", time: "11:00", status: "Completed", topics: ["Product penetration"], agenda: ["GAP selling technique", "Bundle strategy"], actionItems: [{ id: "a4", text: "Increase GAP offer rate to 90%", assignee: "Sarah Kim", dueDate: "2026-03-19", completed: false, meetingId: "m4" }], notes: "Strong closer but missing early product mentions.", followUpRequired: false, recurring: "weekly", duration: 28 },
    { id: "m5", managerName: "Marcus Rivera", trainerName: "Coach Williams", date: "2026-03-12", time: "10:00", status: "Completed", topics: ["Follow-up: Menu presentation"], agenda: ["Role-play review", "Score check"], actionItems: [{ id: "a5", text: "Record 2 practice sessions", assignee: "Marcus Rivera", dueDate: "2026-03-19", completed: true, meetingId: "m5" }], notes: "Menu scores improved from 72 to 79.", followUpRequired: false, recurring: "weekly", duration: 30 },
    { id: "m6", managerName: "Jessica Chen", trainerName: "Coach Williams", date: "2026-03-13", time: "14:00", status: "Missed", topics: ["Objection follow-up"], agenda: ["Review practice recordings"], actionItems: [], notes: "", followUpRequired: true, recurring: "weekly", duration: 0 },
    { id: "m7", managerName: "David Park", trainerName: "Coach Patel", date: "2026-03-19", time: "09:00", status: "Completed", topics: ["Compliance progress"], agenda: ["Module completion review", "Live session audit"], actionItems: [{ id: "a6", text: "Shadow Jessica for objection tips", assignee: "David Park", dueDate: "2026-03-26", completed: false, meetingId: "m7" }], notes: "Compliance module 60% complete. Improving.", followUpRequired: false, recurring: "biweekly", duration: 32 },
    { id: "m8", managerName: "Marcus Rivera", trainerName: "Coach Williams", date: "2026-03-19", time: "10:00", status: "Completed", topics: ["Closing techniques"], agenda: ["Assumptive close practice", "Customer engagement"], actionItems: [{ id: "a7", text: "Use assumptive close in next 5 deals", assignee: "Marcus Rivera", dueDate: "2026-03-26", completed: false, meetingId: "m8" }], notes: "Confident on assumptive close. Ready for advanced techniques.", followUpRequired: false, recurring: "weekly", duration: 30 },
    // 3 upcoming meetings
    { id: "m9", managerName: "Sarah Kim", trainerName: "Coach Patel", date: "2026-04-02", time: "11:00", status: "Scheduled", topics: ["Bundle optimization"], agenda: ["Review bundle acceptance rates", "New bundle configurations"], actionItems: [], notes: "", followUpRequired: false, recurring: "weekly" },
    { id: "m10", managerName: "Jessica Chen", trainerName: "Coach Williams", date: "2026-04-03", time: "14:00", status: "Scheduled", topics: ["Objection deep-dive"], agenda: ["Price objection strategies", "Rate objection strategies"], actionItems: [], notes: "", followUpRequired: false, recurring: "weekly" },
    { id: "m11", managerName: "David Park", trainerName: "Coach Patel", date: "2026-04-03", time: "09:00", status: "Scheduled", topics: ["Compliance final review"], agenda: ["Module completion", "Score review"], actionItems: [], notes: "", followUpRequired: false, recurring: "biweekly" },
  ];
}

function loadMeetings(): Meeting[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* use demo */ }
  const demo = getDemoData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
  return demo;
}

function saveMeetings(meetings: Meeting[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings));
}

const STATUS_STYLES: Record<string, string> = {
  Scheduled: "border-blue-500/30 text-blue-400 bg-blue-500/10",
  Completed: "border-green-500/30 text-green-400 bg-green-500/10",
  Missed: "border-red-500/30 text-red-400 bg-red-500/10",
};

export default function OneOnOneTracker() {
  const [meetings, setMeetings] = useState<Meeting[]>(loadMeetings);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"meetings" | "actions">("meetings");
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Schedule form state
  const [formManager, setFormManager] = useState(MANAGERS[0]);
  const [formTrainer, setFormTrainer] = useState(TRAINERS[0]);
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("10:00");
  const [formTopics, setFormTopics] = useState("");
  const [formRecurring, setFormRecurring] = useState<"none" | "weekly" | "biweekly" | "monthly">("none");

  useEffect(() => {
    saveMeetings(meetings);
  }, [meetings]);

  // Summary stats
  const thisMonth = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    return meetings.filter((m) => {
      const d = new Date(m.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
  }, [meetings]);

  const completedCount = thisMonth.filter((m) => m.status === "Completed").length;
  const missedCount = thisMonth.filter((m) => m.status === "Missed").length;
  const completionRate = completedCount + missedCount > 0
    ? Math.round((completedCount / (completedCount + missedCount)) * 100)
    : 100;
  const openActions = meetings.flatMap((m) => m.actionItems).filter((a) => !a.completed);
  const avgDuration = useMemo(() => {
    const completed = meetings.filter((m) => m.status === "Completed" && m.duration);
    if (completed.length === 0) return 0;
    return Math.round(completed.reduce((s, m) => s + (m.duration || 0), 0) / completed.length);
  }, [meetings]);

  // Calendar mini-view
  const calendarDots = useMemo(() => {
    const dots: Record<string, number> = {};
    for (const m of meetings) {
      dots[m.date] = (dots[m.date] || 0) + 1;
    }
    return dots;
  }, [meetings]);

  const currentMonth = new Date();
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const monthName = currentMonth.toLocaleString("default", { month: "long", year: "numeric" });

  const handleSchedule = () => {
    if (!formDate || !formManager) return;
    const newMeeting: Meeting = {
      id: `m-${Date.now()}`,
      managerName: formManager,
      trainerName: formTrainer,
      date: formDate,
      time: formTime,
      status: "Scheduled",
      topics: formTopics.split(",").map((t) => t.trim()).filter(Boolean),
      agenda: [],
      actionItems: [],
      notes: "",
      followUpRequired: false,
      recurring: formRecurring,
    };
    setMeetings((prev) => [...prev, newMeeting]);
    setShowScheduleModal(false);
    setFormTopics("");
    setFormDate("");
  };

  const toggleActionItem = (meetingId: string, actionId: string) => {
    setMeetings((prev) =>
      prev.map((m) =>
        m.id === meetingId
          ? {
              ...m,
              actionItems: m.actionItems.map((a) =>
                a.id === actionId ? { ...a, completed: !a.completed } : a
              ),
            }
          : m
      )
    );
  };

  const updateNotes = (meetingId: string, notes: string) => {
    setMeetings((prev) =>
      prev.map((m) => (m.id === meetingId ? { ...m, notes } : m))
    );
  };

  const allActionItems = meetings.flatMap((m) =>
    m.actionItems.map((a) => ({ ...a, meetingDate: m.date }))
  );
  const sortedActions = [...allActionItems].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return a.dueDate.localeCompare(b.dueDate);
  });

  return (
    <AppLayout title="1-on-1 Tracker" subtitle="Track coaching meetings between trainers and F&I managers">
      <div className="p-4 lg:p-6 space-y-6">
        {/* Summary Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Calendar className="w-4 h-4" /> Meetings This Month</div>
            <p className="text-2xl font-bold text-foreground">{thisMonth.length}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><CheckCircle2 className="w-4 h-4" /> Completion Rate</div>
            <p className="text-2xl font-bold text-foreground">{completionRate}%</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><ListTodo className="w-4 h-4" /> Open Action Items</div>
            <p className="text-2xl font-bold text-foreground">{openActions.length}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Clock className="w-4 h-4" /> Avg Duration</div>
            <p className="text-2xl font-bold text-foreground">{avgDuration} min</p>
          </Card>
        </div>

        {/* Tabs + Schedule Button */}
        <div className="flex items-center gap-2">
          <Button variant={activeTab === "meetings" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("meetings")}>
            Meetings
          </Button>
          <Button variant={activeTab === "actions" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("actions")}>
            Action Items
          </Button>
          <Button size="sm" className="ml-auto" onClick={() => setShowScheduleModal(true)}>
            <Plus className="w-4 h-4 mr-1" /> Schedule 1-on-1
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-3">
            {activeTab === "meetings" ? (
              [...meetings].sort((a, b) => b.date.localeCompare(a.date)).map((meeting) => {
                const isExpanded = expandedId === meeting.id;
                return (
                  <Card key={meeting.id} className="p-3">
                    <div
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : meeting.id)}
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{meeting.managerName}</p>
                          <Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[meeting.status]}`}>
                            {meeting.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {meeting.date} at {meeting.time} · {meeting.trainerName}
                          {meeting.topics.length > 0 && ` · ${meeting.topics.join(", ")}`}
                        </p>
                      </div>
                      {meeting.followUpRequired && (
                        <Badge variant="outline" className="text-[10px] border-orange-500/30 text-orange-400 shrink-0">Follow Up</Badge>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-border space-y-3">
                        {/* Agenda */}
                        {meeting.agenda.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Agenda</p>
                            <ul className="text-sm text-foreground space-y-1">
                              {meeting.agenda.map((item, i) => (
                                <li key={i} className="flex items-center gap-2">
                                  <span className="text-muted-foreground">{i + 1}.</span> {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Action Items */}
                        {meeting.actionItems.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Action Items</p>
                            {meeting.actionItems.map((ai) => (
                              <div key={ai.id} className="flex items-center gap-2 text-sm">
                                <button onClick={(e) => { e.stopPropagation(); toggleActionItem(meeting.id, ai.id); }}>
                                  {ai.completed ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
                                </button>
                                <span className={ai.completed ? "line-through text-muted-foreground" : "text-foreground"}>{ai.text}</span>
                                <span className="text-xs text-muted-foreground ml-auto">{ai.assignee} · Due {ai.dueDate}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Notes */}
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Notes</p>
                          <textarea
                            value={meeting.notes}
                            onChange={(e) => updateNotes(meeting.id, e.target.value)}
                            className="w-full text-sm bg-accent/30 rounded p-2 border border-border text-foreground min-h-[60px] resize-none"
                            placeholder="Meeting notes..."
                          />
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })
            ) : (
              <div className="space-y-2">
                {sortedActions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No action items yet</p>
                )}
                {sortedActions.map((ai) => (
                  <Card key={ai.id} className="p-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleActionItem(ai.meetingId, ai.id)}>
                        {ai.completed ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${ai.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>{ai.text}</p>
                        <p className="text-xs text-muted-foreground">{ai.assignee} · Due {ai.dueDate}</p>
                      </div>
                      <Badge variant="outline" className={ai.completed ? "text-[10px] border-green-500/30 text-green-400" : "text-[10px]"}>
                        {ai.completed ? "Done" : "Open"}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Calendar Mini-View */}
          <Card className="p-4 h-fit">
            <h3 className="text-sm font-semibold text-foreground mb-3">{monthName}</h3>
            <div className="grid grid-cols-7 gap-1 text-center">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <div key={d} className="text-[10px] text-muted-foreground font-medium py-1">{d}</div>
              ))}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const hasMeeting = calendarDots[dateStr];
                const isToday = day === new Date().getDate();
                return (
                  <div
                    key={day}
                    className={`text-xs py-1 rounded ${isToday ? "bg-primary/20 text-primary font-bold" : "text-foreground"}`}
                  >
                    {day}
                    {hasMeeting && (
                      <div className="flex justify-center gap-0.5 mt-0.5">
                        {Array.from({ length: Math.min(hasMeeting, 3) }).map((_, di) => (
                          <div key={di} className="w-1 h-1 rounded-full bg-primary" />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Stats */}
            <div className="mt-4 pt-3 border-t border-border space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Upcoming</span>
                <span className="text-foreground font-medium">{meetings.filter((m) => m.status === "Scheduled").length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Completed</span>
                <span className="text-green-400 font-medium">{meetings.filter((m) => m.status === "Completed").length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Missed</span>
                <span className="text-red-400 font-medium">{meetings.filter((m) => m.status === "Missed").length}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Schedule Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-md mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Schedule 1-on-1</h3>
                <button onClick={() => setShowScheduleModal(false)}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Manager</label>
                  <select value={formManager} onChange={(e) => setFormManager(e.target.value)} className="w-full text-sm bg-accent rounded px-2 py-1.5 border border-border text-foreground mt-1">
                    {MANAGERS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Trainer</label>
                  <select value={formTrainer} onChange={(e) => setFormTrainer(e.target.value)} className="w-full text-sm bg-accent rounded px-2 py-1.5 border border-border text-foreground mt-1">
                    {TRAINERS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Date</label>
                    <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="w-full text-sm bg-accent rounded px-2 py-1.5 border border-border text-foreground mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Time</label>
                    <input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} className="w-full text-sm bg-accent rounded px-2 py-1.5 border border-border text-foreground mt-1" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Topics (comma-separated)</label>
                  <textarea value={formTopics} onChange={(e) => setFormTopics(e.target.value)} className="w-full text-sm bg-accent rounded px-2 py-1.5 border border-border text-foreground mt-1 min-h-[60px] resize-none" placeholder="PVR coaching, Menu presentation..." />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Recurring</label>
                  <select value={formRecurring} onChange={(e) => setFormRecurring(e.target.value as typeof formRecurring)} className="w-full text-sm bg-accent rounded px-2 py-1.5 border border-border text-foreground mt-1">
                    <option value="none">None</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Biweekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <Button onClick={handleSchedule} className="w-full" disabled={!formDate || !formManager}>
                  <Users className="w-4 h-4 mr-1" /> Schedule Meeting
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
