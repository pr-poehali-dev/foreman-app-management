import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { getTimesheet, setTimesheet, getTeam } from "@/lib/api";
import type { TimesheetRow, User } from "@/lib/api";

interface Props { user: User }

type DayStatus = "work" | "off" | "sick" | "vacation" | "absent";

const statusConfig: Record<DayStatus, { label: string; color: string; bg: string }> = {
  work:     { label: "Я", color: "#22c55e", bg: "rgba(34,197,94,0.15)" },
  off:      { label: "—", color: "#4a5568", bg: "rgba(74,85,104,0.15)" },
  sick:     { label: "Б", color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
  vacation: { label: "О", color: "#a855f7", bg: "rgba(168,85,247,0.15)" },
  absent:   { label: "П", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
};

const cycle: DayStatus[] = ["work", "off", "sick", "vacation", "absent"];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function isWeekend(year: number, month: number, day: number) {
  const d = new Date(year, month, day).getDay();
  return d === 0 || d === 6;
}

function dayLabel(year: number, month: number, day: number) {
  return ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'][new Date(year, month, day).getDay()];
}

export default function Timesheet({ user }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [rows, setRows] = useState<TimesheetRow[]>([]);
  const [workers, setWorkers] = useState<{ id: number; full_name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const days = Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1);
  const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

  async function load() {
    setLoading(true);
    try {
      const data = await getTimesheet(monthStr);
      setRows(data);
      if (user.role === 'manager') {
        const team = await getTeam();
        setWorkers(team.filter(u => u.role === 'foreman').map(u => ({ id: u.id, full_name: u.full_name })));
      } else {
        setWorkers([{ id: user.id, full_name: user.full_name }]);
      }
    } catch { setWorkers([{ id: user.id, full_name: user.full_name }]); }
    setLoading(false);
  }

  useEffect(() => { load(); }, [monthStr]);

  function getStatus(workerId: number, day: number): DayStatus {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const row = rows.find(r => r.worker_id === workerId && r.work_date.startsWith(dateStr));
    return (row?.status as DayStatus) || 'off';
  }

  async function toggleCell(workerId: number, day: number) {
    if (isWeekend(year, month, day)) return;
    if (user.role !== 'manager' && workerId !== user.id) return;
    const cur = getStatus(workerId, day);
    const next = cycle[(cycle.indexOf(cur) + 1) % cycle.length];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const optimistic: TimesheetRow = { id: Date.now(), worker_id: workerId, work_date: dateStr, status: next, full_name: '', login: '' };
    setRows(prev => [...prev.filter(r => !(r.worker_id === workerId && r.work_date.startsWith(dateStr))), optimistic]);
    try {
      const updated = await setTimesheet({ worker_id: workerId, work_date: dateStr, status: next });
      setRows(prev => [...prev.filter(r => !(r.worker_id === workerId && r.work_date.startsWith(dateStr))), updated]);
    } catch { /* keep optimistic */ }
  }

  function countWork(workerId: number) {
    return rows.filter(r => r.worker_id === workerId && r.status === 'work' && r.work_date.startsWith(monthStr)).length;
  }

  function prevMonth() { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-oswald font-bold text-white tracking-wide">ТАБЕЛЬ</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{monthNames[month]} {year}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "var(--surface-3)", color: "var(--text-secondary)", border: "1px solid var(--surface-4)" }}>
            <Icon name="ChevronLeft" size={16} />
          </button>
          <button onClick={nextMonth} className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "var(--surface-3)", color: "var(--text-secondary)", border: "1px solid var(--surface-4)" }}>
            <Icon name="ChevronRight" size={16} />
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        {Object.entries(statusConfig).map(([key, s]) => (
          <div key={key} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
            <span className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold" style={{ background: s.bg, color: s.color }}>{s.label}</span>
            {key === "work" ? "Явка" : key === "off" ? "Выходной" : key === "sick" ? "Болезнь" : key === "vacation" ? "Отпуск" : "Прогул"}
          </div>
        ))}
      </div>

      <div className="app-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--surface-3)", borderBottom: "1px solid var(--surface-4)" }}>
                <th className="text-left px-4 py-3 font-medium sticky left-0 z-10 min-w-[160px]"
                  style={{ background: "var(--surface-3)", color: "var(--text-secondary)" }}>Сотрудник</th>
                {days.map(d => (
                  <th key={d} className={`px-1 py-2 text-center min-w-[34px] ${isWeekend(year, month, d) ? "opacity-30" : ""}`}
                    style={{ color: "var(--text-secondary)" }}>
                    <div className="text-[10px]">{dayLabel(year, month, d)}</div>
                    <div className="text-xs font-bold">{d}</div>
                  </th>
                ))}
                <th className="px-3 py-3 text-center font-medium" style={{ color: "var(--text-secondary)" }}>Итого</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={days.length + 2} className="px-4 py-8 text-center" style={{ color: "var(--text-muted)" }}>
                  <Icon name="Loader2" size={20} className="animate-spin mx-auto" />
                </td></tr>
              ) : workers.map(w => (
                <tr key={w.id} style={{ borderBottom: "1px solid var(--surface-4)" }}>
                  <td className="px-4 py-2.5 sticky left-0 z-10" style={{ background: "var(--surface-2)" }}>
                    <p className="font-medium text-white text-sm truncate max-w-[140px]">{w.full_name}</p>
                  </td>
                  {days.map(d => {
                    const we = isWeekend(year, month, d);
                    const st = we ? 'off' : getStatus(w.id, d);
                    const cfg = statusConfig[st];
                    const canEdit = user.role === 'manager' || w.id === user.id;
                    return (
                      <td key={d} className="px-0.5 py-2 text-center">
                        <button onClick={() => !we && canEdit && toggleCell(w.id, d)} disabled={we || !canEdit}
                          className="w-7 h-7 rounded-lg text-xs font-bold mx-auto flex items-center justify-center transition-all hover:scale-110"
                          style={{ background: cfg.bg, color: cfg.color, opacity: we ? 0.2 : 1 }}>
                          {cfg.label}
                        </button>
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-center">
                    <span className="font-bold" style={{ color: "var(--orange)" }}>{countWork(w.id)}</span>
                    <span className="text-xs ml-0.5" style={{ color: "var(--text-muted)" }}>д</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 text-xs" style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}>
          Нажмите ячейку для изменения статуса
        </div>
      </div>
    </div>
  );
}
