import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { getTeam, getWorkers, getWorkerTimesheet, setWorkerTimesheet, getObjects } from "@/lib/api";
import type { WorkerTimesheetRow, Worker, Obj, User } from "@/lib/api";

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

const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

export default function Timesheet({ user }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [tab, setTab] = useState<'workers' | 'foremans'>('workers');
  const [selectedObj, setSelectedObj] = useState<number | 'all'>('all');

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [workerRows, setWorkerRows] = useState<WorkerTimesheetRow[]>([]);
  const [foremans, setForemans] = useState<{ id: number; full_name: string }[]>([]);
  const [objects, setObjects] = useState<Obj[]>([]);
  const [loading, setLoading] = useState(true);

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const days = Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1);

  async function load() {
    setLoading(true);
    try {
      const [objs, ws, wRows] = await Promise.all([
        getObjects(),
        getWorkers(),
        getWorkerTimesheet(monthStr),
      ]);
      setObjects(objs);
      setWorkers(ws);
      setWorkerRows(wRows);

      if (user.role === 'manager') {
        const team = await getTeam();
        setForemans(team.filter(u => u.role === 'foreman').map(u => ({ id: u.id, full_name: u.full_name })));
      }
    } catch { /* offline */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, [monthStr]);

  function getWorkerStatus(workerId: number, day: number): DayStatus {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const row = workerRows.find(r => r.worker_id === workerId && r.work_date.startsWith(dateStr));
    return (row?.status as DayStatus) || 'off';
  }

  async function toggleWorker(workerId: number, day: number, objectId?: number) {
    if (isWeekend(year, month, day)) return;
    const cur = getWorkerStatus(workerId, day);
    const next = cycle[(cycle.indexOf(cur) + 1) % cycle.length];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const optimistic: WorkerTimesheetRow = { id: Date.now(), worker_id: workerId, work_date: dateStr, status: next, full_name: '', object_id: objectId };
    setWorkerRows(prev => [...prev.filter(r => !(r.worker_id === workerId && r.work_date.startsWith(dateStr))), optimistic]);
    try {
      const updated = await setWorkerTimesheet({ worker_id: workerId, work_date: dateStr, status: next, object_id: objectId });
      setWorkerRows(prev => [...prev.filter(r => !(r.worker_id === workerId && r.work_date.startsWith(dateStr))), updated]);
    } catch { /* keep optimistic */ }
  }

  function countWorkerWork(workerId: number) {
    return workerRows.filter(r => r.worker_id === workerId && r.status === 'work' && r.work_date.startsWith(monthStr)).length;
  }

  const visibleWorkers = workers.filter(w => {
    if (selectedObj !== 'all' && w.object_id !== selectedObj) return false;
    return true;
  });

  const objectGroups = objects.filter(o =>
    selectedObj === 'all' ? true : o.id === selectedObj
  ).filter(o => visibleWorkers.some(w => w.object_id === o.id));

  const unassigned = visibleWorkers.filter(w => !w.object_id);

  function prevMonth() { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); }

  const TableHeader = () => (
    <tr style={{ background: "var(--surface-3)", borderBottom: "1px solid var(--surface-4)" }}>
      <th
        className="text-left px-3 py-3 font-medium sticky left-0 z-10 min-w-[130px] sm:min-w-[160px]"
        style={{ background: "var(--surface-3)", color: "var(--text-secondary)" }}>
        Сотрудник
      </th>
      {days.map(d => (
        <th
          key={d}
          className={`px-0.5 py-2 text-center min-w-[30px] sm:min-w-[34px] ${isWeekend(year, month, d) ? "opacity-30" : ""}`}
          style={{ color: "var(--text-secondary)" }}>
          <div className="text-[9px] sm:text-[10px]">{dayLabel(year, month, d)}</div>
          <div className="text-[11px] sm:text-xs font-bold">{d}</div>
        </th>
      ))}
      <th className="px-2 sm:px-3 py-3 text-center font-medium whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>
        Итого
      </th>
    </tr>
  );

  interface WorkerRowProps { w: Worker }
  const WorkerRow = ({ w }: WorkerRowProps) => (
    <tr style={{ borderBottom: "1px solid var(--surface-4)" }}>
      <td className="px-3 py-2.5 sticky left-0 z-10" style={{ background: "var(--surface-2)" }}>
        <p className="font-medium text-white text-xs sm:text-sm truncate max-w-[110px] sm:max-w-[140px]">{w.full_name}</p>
        {w.specialty && <p className="text-[10px] sm:text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{w.specialty}</p>}
      </td>
      {days.map(d => {
        const we = isWeekend(year, month, d);
        const st = we ? 'off' : getWorkerStatus(w.id, d);
        const cfg = statusConfig[st];
        return (
          <td key={d} className="px-0 py-2 text-center">
            <button
              onClick={() => !we && toggleWorker(w.id, d, w.object_id ?? undefined)}
              disabled={we}
              className="w-7 h-7 rounded-lg text-xs font-bold mx-auto flex items-center justify-center transition-all active:scale-95 hover:scale-110"
              style={{ background: cfg.bg, color: cfg.color, opacity: we ? 0.2 : 1 }}>
              {cfg.label}
            </button>
          </td>
        );
      })}
      <td className="px-2 sm:px-3 py-2 text-center">
        <span className="font-bold text-sm" style={{ color: "var(--orange)" }}>{countWorkerWork(w.id)}</span>
        <span className="text-xs ml-0.5" style={{ color: "var(--text-muted)" }}>д</span>
      </td>
    </tr>
  );

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-oswald font-bold text-white tracking-wide">ТАБЕЛЬ</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {monthNames[month]} {year}
          </p>
        </div>
        {/* Month navigation — 44px buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: "var(--surface-3)", color: "var(--text-secondary)", border: "1px solid var(--surface-4)" }}>
            <Icon name="ChevronLeft" size={18} />
          </button>
          <button
            onClick={nextMonth}
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: "var(--surface-3)", color: "var(--text-secondary)", border: "1px solid var(--surface-4)" }}>
            <Icon name="ChevronRight" size={18} />
          </button>
        </div>
      </div>

      {/* Tabs + object select */}
      <div className="flex flex-col gap-2 mb-4">
        {/* Tab buttons — horizontal scroll on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {[
            { id: 'workers' as const, label: `Рабочие (${workers.length})`, icon: 'HardHat' },
            ...(user.role === 'manager' ? [{ id: 'foremans' as const, label: `Прорабы (${foremans.length})`, icon: 'Users' }] : []),
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap min-h-[44px] ${tab === t.id ? 'btn-orange' : ''}`}
              style={tab !== t.id ? { background: "var(--surface-3)", color: "var(--text-secondary)", border: "1px solid var(--surface-4)" } : {}}>
              <Icon name={t.icon} fallback="Circle" size={15} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Object filter — full width, separate row on mobile */}
        {tab === 'workers' && objects.length > 0 && (
          <select
            value={selectedObj}
            onChange={e => setSelectedObj(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="w-full sm:w-auto sm:self-start px-4 py-3 rounded-xl text-base outline-none min-h-[44px]"
            style={{ background: "var(--surface-3)", border: "1px solid var(--surface-4)", color: "var(--text-primary)" }}>
            <option value="all">Все объекты</option>
            {objects.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        )}
      </div>

      {/* Legend — horizontal scroll, no wrap */}
      <div className="flex gap-3 mb-4 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {Object.entries(statusConfig).map(([key, s]) => (
          <div key={key} className="flex items-center gap-1.5 text-xs whitespace-nowrap flex-shrink-0" style={{ color: "var(--text-secondary)" }}>
            <span
              className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: s.bg, color: s.color }}>
              {s.label}
            </span>
            {key === "work" ? "Явка" : key === "off" ? "Выходной" : key === "sick" ? "Болезнь" : key === "vacation" ? "Отпуск" : "Прогул"}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1,2].map(i => <div key={i} className="skeleton h-40 rounded-2xl" />)}
        </div>
      ) : tab === 'workers' ? (
        <>
          {visibleWorkers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: "var(--text-muted)" }}>
              <Icon name="HardHat" size={40} />
              <p className="text-sm text-center">Рабочих пока нет — добавьте в разделе «Рабочие»</p>
            </div>
          ) : (
            <>
              {/* По объектам */}
              {objectGroups.map(obj => {
                const objWorkers = visibleWorkers.filter(w => w.object_id === obj.id);
                if (!objWorkers.length) return null;
                return (
                  <div key={obj.id} className="mb-5">
                    {/* Object label */}
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <Icon name="Building2" size={15} style={{ color: "var(--orange)" }} />
                      <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--orange)" }}>
                        {obj.name}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}>
                        {objWorkers.length} чел. · явок: {objWorkers.filter(w => getWorkerStatus(w.id, now.getDate()) === 'work').length}
                      </span>
                    </div>
                    <div className="app-card overflow-hidden">
                      <div className="table-scroll overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead><TableHeader /></thead>
                          <tbody>{objWorkers.map(w => <WorkerRow key={w.id} w={w} />)}</tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Без объекта */}
              {unassigned.length > 0 && selectedObj === 'all' && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <Icon name="UserX" size={15} style={{ color: "var(--text-muted)" }} />
                    <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                      Без объекта
                    </span>
                  </div>
                  <div className="app-card overflow-hidden">
                    <div className="table-scroll overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><TableHeader /></thead>
                        <tbody>{unassigned.map(w => <WorkerRow key={w.id} w={w} />)}</tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        /* Прорабы */
        <div className="app-card overflow-hidden">
          {foremans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: "var(--text-muted)" }}>
              <Icon name="Users" size={40} />
              <p className="text-sm">Прорабов нет</p>
            </div>
          ) : (
            <div className="table-scroll overflow-x-auto">
              <table className="w-full text-sm">
                <thead><TableHeader /></thead>
                <tbody>
                  {foremans.map(f => (
                    <tr key={f.id} style={{ borderBottom: "1px solid var(--surface-4)" }}>
                      <td className="px-3 py-3 sticky left-0 z-10" style={{ background: "var(--surface-2)" }}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: "rgba(255,140,0,0.15)", color: "var(--orange)" }}>
                            {f.full_name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                          </div>
                          <p className="font-medium text-white text-xs sm:text-sm truncate max-w-[90px] sm:max-w-[110px]">
                            {f.full_name}
                          </p>
                        </div>
                      </td>
                      {days.map(d => {
                        const we = isWeekend(year, month, d);
                        const cfg = statusConfig[we ? 'off' : 'work'];
                        return (
                          <td key={d} className="px-0 py-2 text-center">
                            <div
                              className="w-7 h-7 rounded-lg text-xs font-bold mx-auto flex items-center justify-center"
                              style={{ background: cfg.bg, color: cfg.color, opacity: we ? 0.2 : 1 }}>
                              {cfg.label}
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-2 sm:px-3 py-2 text-center">
                        <span className="font-bold text-sm" style={{ color: "var(--orange)" }}>
                          {days.filter(d => !isWeekend(year, month, d)).length}
                        </span>
                        <span className="text-xs ml-0.5" style={{ color: "var(--text-muted)" }}>д</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-4 py-2.5 text-xs" style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}>
            Табель прорабов — только просмотр
          </div>
        </div>
      )}

      {/* Bottom hint */}
      {tab === 'workers' && visibleWorkers.length > 0 && (
        <p className="text-xs mt-3 text-center" style={{ color: "var(--text-muted)" }}>
          Нажмите на ячейку для изменения статуса
        </p>
      )}
    </div>
  );
}
