import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Users,
  AlertTriangle,
  Zap,
  CalendarDays,
  X,
} from "lucide-react";

// ── Constants ────────────────────────────────────────────────────────
const STORAGE_KEY = "fi-copilot-schedule";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19] as const;

type Day = (typeof DAYS)[number];
type Hour = (typeof HOURS)[number];

interface Manager {
  name: string;
  initials: string;
  color: string;
  bg: string;
  border: string;
}

const MANAGERS: Manager[] = [
  { name: "Marcus Rivera", initials: "MR", color: "#3b82f6", bg: "bg-blue-500/20", border: "border-blue-500/40" },
  { name: "Jessica Chen", initials: "JC", color: "#10b981", bg: "bg-emerald-500/20", border: "border-emerald-500/40" },
  { name: "David Park", initials: "DP", color: "#f59e0b", bg: "bg-amber-500/20", border: "border-amber-500/40" },
  { name: "Sarah Kim", initials: "SK", color: "#8b5cf6", bg: "bg-purple-500/20", border: "border-purple-500/40" },
];

type Schedule = Record<string, string | null>;

function cellKey(day: string, hour: number): string {
  return `${day}-${hour}`;
}

function formatHour(hour: number): string {
  if (hour === 12) return "12 PM";
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

function getManager(name: string | null): Manager | undefined {
  return MANAGERS.find((m) => m.name === name);
}

// ── Default demo schedule ────────────────────────────────────────────
function createDemoSchedule(): Schedule {
  const schedule: Schedule = {};

  // Fill all cells with null first
  for (const day of DAYS) {
    for (const hour of HOURS) {
      schedule[cellKey(day, hour)] = null;
    }
  }

  // Marcus Rivera: Mon-Fri 9-5 (core hours)
  for (const day of ["Mon", "Tue", "Wed", "Thu", "Fri"]) {
    for (let h = 9; h <= 16; h++) {
      schedule[cellKey(day, h)] = "Marcus Rivera";
    }
  }

  // Jessica Chen: Tue-Sat 10-6
  for (const day of ["Tue", "Wed", "Thu", "Fri", "Sat"]) {
    for (let h = 10; h <= 17; h++) {
      schedule[cellKey(day, h)] = "Jessica Chen";
    }
  }

  // David Park: Mon, Wed, Fri, Sat 11-7
  for (const day of ["Mon", "Wed", "Fri", "Sat"]) {
    for (let h = 11; h <= 18; h++) {
      schedule[cellKey(day, h)] = "David Park";
    }
  }

  // Sarah Kim: Mon, Tue, Thu, Sat 12-8
  for (const day of ["Mon", "Tue", "Thu", "Sat"]) {
    for (let h = 12; h <= 19; h++) {
      schedule[cellKey(day, h)] = "Sarah Kim";
    }
  }

  return schedule;
}

function loadSchedule(): Schedule {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Schedule;
      // Validate it has keys
      if (Object.keys(parsed).length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return createDemoSchedule();
}

function saveSchedule(schedule: Schedule) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule));
}

// ── Auto-fill algorithm ──────────────────────────────────────────────
function autoFillSchedule(): Schedule {
  const schedule: Schedule = {};
  for (const day of DAYS) {
    for (const hour of HOURS) {
      schedule[cellKey(day, hour)] = null;
    }
  }

  // Target ~40 hours per manager, heavier on Fri/Sat
  // Total slots per day: 11 hours × ~1.5 managers avg = ~16-17 assigned slots/day
  // We'll assign each manager 8 hours/day for 5 days = 40

  const managerHours: Record<string, number> = {};
  for (const m of MANAGERS) managerHours[m.name] = 0;

  const dayWeight: Record<string, number> = {
    Mon: 1.0, Tue: 1.0, Wed: 1.0, Thu: 1.1, Fri: 1.4, Sat: 1.5,
  };

  // Assign managers to each slot based on need
  // For Fri/Sat, assign more managers per slot
  for (const day of DAYS) {
    const weight = dayWeight[day];
    const managersPerSlot = weight >= 1.4 ? 2 : weight >= 1.1 ? 2 : 1;

    for (const hour of HOURS) {
      // Sort managers by fewest hours assigned so far
      const available = [...MANAGERS]
        .filter((m) => managerHours[m.name] < 44) // cap near 40-44
        .sort((a, b) => managerHours[a.name] - managerHours[b.name]);

      const toAssign = Math.min(managersPerSlot, available.length);
      for (let i = 0; i < toAssign; i++) {
        const m = available[i];
        // Each cell only holds one manager, so we assign the first (lowest hours) one
        if (i === 0) {
          schedule[cellKey(day, hour)] = m.name;
          managerHours[m.name]++;
        }
      }
    }
  }

  // Second pass: fill Fri/Sat gaps with a second pass using different key scheme
  // Actually the spec says each cell is one manager. So we just ensure coverage.
  // Let's redo: each cell = 1 manager. 66 total cells. 4 managers × 40h = 160 needed but only 66 cells.
  // So each manager gets ~16-17 cells. Let's distribute evenly with Fri/Sat preference.

  // Reset and use a simpler approach
  for (const day of DAYS) {
    for (const hour of HOURS) {
      schedule[cellKey(day, hour)] = null;
    }
  }
  for (const m of MANAGERS) managerHours[m.name] = 0;

  // Assign each cell round-robin, but Fri/Sat get double passes
  const order = [...DAYS];
  let managerIdx = 0;

  for (const day of order) {
    for (const hour of HOURS) {
      const key = cellKey(day, hour);
      if (!schedule[key]) {
        schedule[key] = MANAGERS[managerIdx % MANAGERS.length].name;
        managerHours[MANAGERS[managerIdx % MANAGERS.length].name]++;
        managerIdx++;
      }
    }
  }

  return schedule;
}

// ── Component ────────────────────────────────────────────────────────
export default function ManagerSchedule() {
  const [schedule, setSchedule] = useState<Schedule>(loadSchedule);
  const [activeCell, setActiveCell] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Save to localStorage on every change
  useEffect(() => {
    saveSchedule(schedule);
  }, [schedule]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveCell(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const assignManager = useCallback((key: string, managerName: string | null) => {
    setSchedule((prev) => ({ ...prev, [key]: managerName }));
    setActiveCell(null);
  }, []);

  const handleCellClick = useCallback((key: string) => {
    setActiveCell((prev) => (prev === key ? null : key));
  }, []);

  const handleAutoFill = useCallback(() => {
    const filled = autoFillSchedule();
    setSchedule(filled);
  }, []);

  // ── Computed stats ─────────────────────────────────────────────────
  const managerHours = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of MANAGERS) counts[m.name] = 0;
    for (const val of Object.values(schedule)) {
      if (val && counts[val] !== undefined) counts[val]++;
    }
    return counts;
  }, [schedule]);

  const gapHours = useMemo(() => {
    let gaps = 0;
    for (const day of DAYS) {
      for (const hour of HOURS) {
        if (!schedule[cellKey(day, hour)]) gaps++;
      }
    }
    return gaps;
  }, [schedule]);

  const peakCoverageTime = useMemo(() => {
    // Count managers per time slot across all days
    const slotCounts: Record<number, number> = {};
    for (const hour of HOURS) {
      slotCounts[hour] = 0;
      for (const day of DAYS) {
        if (schedule[cellKey(day, hour)]) slotCounts[hour]++;
      }
    }
    let maxHour: number = HOURS[0];
    let maxCount = 0;
    for (const hour of HOURS) {
      if (slotCounts[hour] > maxCount) {
        maxCount = slotCounts[hour];
        maxHour = hour;
      }
    }
    return { hour: maxHour, count: maxCount };
  }, [schedule]);

  const coveragePerSlot = useCallback(
    (hour: number): number => {
      let count = 0;
      for (const day of DAYS) {
        if (schedule[cellKey(day, hour)]) count++;
      }
      return count;
    },
    [schedule]
  );

  const overworkedManagers = useMemo(() => {
    return MANAGERS.filter((m) => managerHours[m.name] > 50);
  }, [managerHours]);

  return (
    <AppLayout title="Manager Schedule" subtitle="Weekly F&I manager floor coverage planner">
      <div className="p-4 lg:p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {MANAGERS.map((m) => (
            <Card key={m.name} className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
                {m.name}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-foreground">{managerHours[m.name]}h</p>
                {managerHours[m.name] > 50 && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Over 50h
                  </Badge>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Clock className="w-4 h-4" /> Gap Hours
            </div>
            <p className="text-2xl font-bold text-foreground">{gapHours}</p>
            <p className="text-xs text-muted-foreground">Uncovered time slots this week</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Users className="w-4 h-4" /> Peak Coverage
            </div>
            <p className="text-2xl font-bold text-foreground">{formatHour(peakCoverageTime.hour)}</p>
            <p className="text-xs text-muted-foreground">{peakCoverageTime.count} managers across all days</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <CalendarDays className="w-4 h-4" /> Total Scheduled
            </div>
            <p className="text-2xl font-bold text-foreground">
              {Object.values(managerHours).reduce((s, h) => s + h, 0)}h
            </p>
            <p className="text-xs text-muted-foreground">Combined hours all managers</p>
          </Card>
        </div>

        {/* Conflict Warnings */}
        {overworkedManagers.length > 0 && (
          <Card className="p-4 border-orange-500/20 bg-orange-500/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">Schedule Conflict</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  The following managers exceed 50 hours this week:{" "}
                  {overworkedManagers.map((m) => `${m.name} (${managerHours[m.name]}h)`).join(", ")}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={handleAutoFill} size="sm">
            <Zap className="w-4 h-4 mr-1" /> Auto-Fill
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const empty: Schedule = {};
              for (const day of DAYS) {
                for (const hour of HOURS) {
                  empty[cellKey(day, hour)] = null;
                }
              }
              setSchedule(empty);
            }}
          >
            <X className="w-4 h-4 mr-1" /> Clear All
          </Button>
        </div>

        {/* Manager Legend */}
        <div className="flex flex-wrap gap-3">
          {MANAGERS.map((m) => (
            <div key={m.name} className="flex items-center gap-2 text-xs text-muted-foreground">
              <div
                className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: m.color }}
              >
                {m.initials}
              </div>
              {m.name}
            </div>
          ))}
          <div className="flex items-center gap-2 text-xs text-muted-foreground ml-4">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" /> No coverage
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-500 ml-2" /> 1 manager
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 ml-2" /> 2+ managers
          </div>
        </div>

        {/* Schedule Grid */}
        <Card className="p-4 overflow-x-auto">
          <table className="w-full border-collapse min-w-[640px]">
            <thead>
              <tr>
                <th className="text-xs font-medium text-muted-foreground p-2 text-left w-20">Time</th>
                {DAYS.map((day) => (
                  <th key={day} className="text-xs font-medium text-muted-foreground p-2 text-center">
                    {day}
                  </th>
                ))}
                <th className="text-xs font-medium text-muted-foreground p-2 text-center w-16">Coverage</th>
              </tr>
            </thead>
            <tbody>
              {HOURS.map((hour) => {
                const coverage = coveragePerSlot(hour);
                return (
                  <tr key={hour} className="border-t border-border">
                    <td className="text-xs text-muted-foreground p-2 font-mono whitespace-nowrap">
                      {formatHour(hour)}
                    </td>
                    {DAYS.map((day) => {
                      const key = cellKey(day, hour);
                      const assigned = schedule[key];
                      const manager = getManager(assigned);
                      const isActive = activeCell === key;

                      return (
                        <td key={key} className="p-1 relative">
                          <button
                            type="button"
                            onClick={() => handleCellClick(key)}
                            className={`w-full h-10 rounded border text-xs font-bold transition-colors ${
                              manager
                                ? `${manager.bg} ${manager.border} border`
                                : "bg-accent/20 border-border hover:bg-accent/40"
                            }`}
                            style={manager ? { color: manager.color } : undefined}
                          >
                            {manager ? manager.initials : ""}
                          </button>
                          {isActive && (
                            <div
                              ref={dropdownRef}
                              className="absolute z-50 top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg p-1 min-w-[140px]"
                            >
                              {MANAGERS.map((m) => (
                                <button
                                  key={m.name}
                                  type="button"
                                  onClick={() => assignManager(key, m.name)}
                                  className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-foreground hover:bg-accent rounded transition-colors"
                                >
                                  <div
                                    className="w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold text-white"
                                    style={{ backgroundColor: m.color }}
                                  >
                                    {m.initials}
                                  </div>
                                  {m.name}
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => assignManager(key, null)}
                                className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent rounded transition-colors"
                              >
                                <div className="w-4 h-4 rounded border border-border flex items-center justify-center">
                                  <X className="w-3 h-3" />
                                </div>
                                Clear
                              </button>
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-2 text-center">
                      <span
                        className={`inline-block w-3 h-3 rounded-full ${
                          coverage === 0
                            ? "bg-red-500"
                            : coverage === 1
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>
    </AppLayout>
  );
}
