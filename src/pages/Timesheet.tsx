import { useState } from "react";
import Icon from "@/components/ui/icon";

const workers = [
  { id: 1, name: "Ахметов Р.К.", role: "Каменщик", object: "ЖК «Северный берег»" },
  { id: 2, name: "Борисов С.П.", role: "Сварщик", object: "БЦ «Меридиан»" },
  { id: 3, name: "Васильев Н.О.", role: "Плотник", object: "ЖК «Северный берег»" },
  { id: 4, name: "Гусев Д.Л.", role: "Бетонщик", object: "БЦ «Меридиан»" },
  { id: 5, name: "Дмитриев А.С.", role: "Монтажник", object: "Школа №47" },
  { id: 6, name: "Егоров В.М.", role: "Электрик", object: "Школа №47" },
];

const days = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const dayLabels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const weekend = [5, 6, 12, 13];

type DayStatus = "work" | "off" | "sick" | "vacation" | "absent";

const initialData: Record<number, Record<number, DayStatus>> = {
  1: { 2:"work",3:"work",4:"work",5:"off",6:"off",7:"work",8:"work",9:"work",10:"work",11:"work",12:"off",13:"off",14:"work" },
  2: { 2:"work",3:"work",4:"sick",5:"off",6:"off",7:"sick",8:"work",9:"work",10:"work",11:"work",12:"off",13:"off",14:"work" },
  3: { 2:"work",3:"work",4:"work",5:"off",6:"off",7:"work",8:"work",9:"absent",10:"work",11:"work",12:"off",13:"off",14:"work" },
  4: { 2:"vacation",3:"vacation",4:"vacation",5:"off",6:"off",7:"vacation",8:"work",9:"work",10:"work",11:"work",12:"off",13:"off",14:"work" },
  5: { 2:"work",3:"work",4:"work",5:"off",6:"off",7:"work",8:"work",9:"work",10:"work",11:"work",12:"off",13:"off",14:"work" },
  6: { 2:"work",3:"work",4:"work",5:"off",6:"off",7:"work",8:"work",9:"work",10:"absent",11:"absent",12:"off",13:"off",14:"work" },
};

const statusConfig: Record<DayStatus, { label: string; color: string; bg: string }> = {
  work:     { label: "Я", color: "#22c55e", bg: "rgba(34,197,94,0.15)" },
  off:      { label: "—", color: "#4a5568", bg: "rgba(74,85,104,0.15)" },
  sick:     { label: "Б", color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
  vacation: { label: "О", color: "#a855f7", bg: "rgba(168,85,247,0.15)" },
  absent:   { label: "П", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
};

const month = "Июнь 2026";

function countWork(row: Record<number, DayStatus>) {
  return Object.values(row).filter(v => v === "work").length;
}

export default function Timesheet() {
  const [data, setData] = useState(initialData);
  const [activeWorker, setActiveWorker] = useState<number | null>(null);
  const [activeDay, setActiveDay] = useState<number | null>(null);

  const cycle: DayStatus[] = ["work", "off", "sick", "vacation", "absent"];

  function toggleCell(wid: number, day: number) {
    if (weekend.includes(day)) return;
    setData(prev => {
      const cur = prev[wid]?.[day] ?? "work";
      const next = cycle[(cycle.indexOf(cur) + 1) % cycle.length];
      return { ...prev, [wid]: { ...prev[wid], [day]: next } };
    });
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-oswald font-bold text-white tracking-wide">ТАБЕЛЬ</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{month}</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: "var(--surface-3)", color: "var(--text-secondary)", border: "1px solid var(--surface-4)" }}>
            <Icon name="Download" size={15} />
            Экспорт
          </button>
          <button className="btn-orange flex items-center gap-2 text-sm">
            <Icon name="Plus" size={16} />
            Добавить
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 mb-5 flex-wrap">
        {Object.entries(statusConfig).map(([key, s]) => (
          <div key={key} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
            <span className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold" style={{ background: s.bg, color: s.color }}>
              {s.label}
            </span>
            {key === "work" ? "Явка" : key === "off" ? "Выходной" : key === "sick" ? "Болезнь" : key === "vacation" ? "Отпуск" : "Прогул"}
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="app-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--surface-3)", borderBottom: "1px solid var(--surface-4)" }}>
                <th className="text-left px-4 py-3 font-medium sticky left-0 z-10 min-w-[180px]"
                  style={{ background: "var(--surface-3)", color: "var(--text-secondary)" }}>
                  Сотрудник
                </th>
                {days.map((d, i) => (
                  <th key={d} className={`px-2 py-3 text-center font-medium min-w-[38px] ${weekend.includes(d) ? "opacity-40" : ""}`}
                    style={{ color: activeDay === d ? "var(--orange)" : "var(--text-secondary)" }}
                    onClick={() => setActiveDay(activeDay === d ? null : d)}>
                    <div className="text-xs">{dayLabels[i]}</div>
                    <div className="text-sm font-bold">{d}</div>
                  </th>
                ))}
                <th className="px-4 py-3 text-center font-medium" style={{ color: "var(--text-secondary)" }}>Итого</th>
              </tr>
            </thead>
            <tbody>
              {workers.map(w => (
                <tr key={w.id}
                  className="transition-colors"
                  style={{ borderBottom: "1px solid var(--surface-4)", background: activeWorker === w.id ? "rgba(255,140,0,0.04)" : undefined }}
                  onMouseEnter={() => setActiveWorker(w.id)}
                  onMouseLeave={() => setActiveWorker(null)}>
                  <td className="px-4 py-3 sticky left-0 z-10" style={{ background: activeWorker === w.id ? "#0f1117" : "var(--surface-2)" }}>
                    <div className="font-semibold text-white text-sm">{w.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{w.role}</div>
                  </td>
                  {days.map(d => {
                    const st = data[w.id]?.[d] ?? "work";
                    const cfg = statusConfig[st];
                    const isWe = weekend.includes(d);
                    return (
                      <td key={d} className="px-1 py-3 text-center">
                        <button
                          onClick={() => toggleCell(w.id, d)}
                          disabled={isWe}
                          className="w-8 h-8 rounded-lg text-xs font-bold mx-auto flex items-center justify-center transition-all hover:scale-110"
                          style={{ background: cfg.bg, color: cfg.color, opacity: isWe ? 0.3 : 1 }}>
                          {cfg.label}
                        </button>
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold" style={{ color: "var(--orange)" }}>
                      {countWork(data[w.id] ?? {})}
                    </span>
                    <span className="text-xs ml-0.5" style={{ color: "var(--text-muted)" }}>д</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 flex items-center justify-between text-xs" style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}>
          <span>Нажмите на ячейку для изменения статуса</span>
          <span>Всего рабочих: {workers.length}</span>
        </div>
      </div>
    </div>
  );
}
