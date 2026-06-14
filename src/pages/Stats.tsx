import Icon from "@/components/ui/icon";

const metrics = [
  { label: "Объектов в работе", val: "2", sub: "+1 за месяц", icon: "Building2", color: "orange" },
  { label: "Рабочих на смене", val: "20", sub: "из 25 чел.", icon: "Users", color: "green" },
  { label: "Документов", val: "47", sub: "8 загружено", icon: "FileText", color: "blue" },
  { label: "Выполнено задач", val: "83%", sub: "за текущий месяц", icon: "CheckCircle2", color: "purple" },
];

const objectsProgress = [
  { name: "ЖК «Северный берег»", progress: 67, budget: 18.4, spent: 12.3, workers: 12 },
  { name: "БЦ «Меридиан»", progress: 34, budget: 42.1, spent: 14.3, workers: 8 },
  { name: "Школа №47", progress: 89, budget: 9.8, spent: 8.7, workers: 5 },
];

const weekData = [
  { day: "Пн", hours: 82 },
  { day: "Вт", hours: 76 },
  { day: "Ср", hours: 88 },
  { day: "Чт", hours: 91 },
  { day: "Пт", hours: 79 },
  { day: "Сб", hours: 24 },
  { day: "Вс", hours: 0 },
];

const maxHours = Math.max(...weekData.map(d => d.hours));

const colorMap: Record<string, string> = {
  orange: "var(--orange)",
  green: "var(--green)",
  blue: "var(--blue)",
  purple: "var(--purple)",
};

const bgMap: Record<string, string> = {
  orange: "rgba(255,140,0,0.12)",
  green: "rgba(34,197,94,0.12)",
  blue: "rgba(59,130,246,0.12)",
  purple: "rgba(168,85,247,0.12)",
};

export default function Stats() {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-oswald font-bold text-white tracking-wide">СТАТИСТИКА</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>Июнь 2026</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: "var(--surface-3)", color: "var(--text-secondary)", border: "1px solid var(--surface-4)" }}>
          <Icon name="Download" size={15} />
          Отчёт PDF
        </button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5 animate-stagger">
        {metrics.map(m => (
          <div key={m.label} className={`metric-card ${m.color}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: bgMap[m.color] }}>
                <Icon name={m.icon} fallback="Circle" size={18} style={{ color: colorMap[m.color] }} />
              </div>
            </div>
            <div className="text-2xl font-oswald font-bold text-white">{m.val}</div>
            <div className="text-xs mt-1 font-medium" style={{ color: colorMap[m.color] }}>{m.sub}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{m.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        {/* Прогресс объектов */}
        <div className="app-card p-5">
          <h3 className="font-oswald text-base font-semibold text-white mb-4">Прогресс объектов</h3>
          <div className="flex flex-col gap-4">
            {objectsProgress.map(o => (
              <div key={o.name}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-white truncate max-w-[60%]">{o.name}</span>
                  <span className="font-bold" style={{ color: "var(--orange)" }}>{o.progress}%</span>
                </div>
                <div className="progress-bar mb-1.5">
                  <div className="progress-fill" style={{ width: `${o.progress}%` }} />
                </div>
                <div className="flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                  <span>{o.workers} рабочих</span>
                  <span>{o.spent} / {o.budget} млн ₽</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Выработка по дням */}
        <div className="app-card p-5">
          <h3 className="font-oswald text-base font-semibold text-white mb-4">Чел/часы за неделю</h3>
          <div className="flex items-end gap-2 h-32">
            {weekData.map(d => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-xs font-semibold" style={{ color: d.hours > 80 ? "var(--orange)" : "var(--text-muted)" }}>
                  {d.hours > 0 ? d.hours : ""}
                </span>
                <div className="w-full rounded-t-lg transition-all"
                  style={{
                    height: maxHours > 0 ? `${(d.hours / maxHours) * 90}px` : "4px",
                    background: d.hours > 80
                      ? "linear-gradient(180deg, var(--orange), rgba(255,140,0,0.4))"
                      : d.hours > 0
                        ? "var(--surface-4)"
                        : "var(--surface-3)",
                    minHeight: 4
                  }} />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{d.day}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 flex justify-between text-xs border-t" style={{ borderColor: "var(--surface-4)", color: "var(--text-muted)" }}>
            <span>Всего за неделю: <span className="text-white font-semibold">{weekData.reduce((a,b)=>a+b.hours,0)} ч/ч</span></span>
            <span>Ср/день: <span className="text-white font-semibold">{Math.round(weekData.filter(d=>d.hours>0).reduce((a,b)=>a+b.hours,0)/weekData.filter(d=>d.hours>0).length)} ч/ч</span></span>
          </div>
        </div>
      </div>

      {/* Бюджет */}
      <div className="app-card p-5">
        <h3 className="font-oswald text-base font-semibold text-white mb-4">Сводка по бюджетам</h3>
        <div className="grid grid-cols-3 gap-4">
          {objectsProgress.map(o => {
            const pct = Math.round((o.spent / o.budget) * 100);
            return (
              <div key={o.name} className="rounded-2xl p-4" style={{ background: "var(--surface-3)" }}>
                <p className="text-xs font-medium text-white mb-3 truncate">{o.name}</p>
                <div className="relative w-20 h-20 mx-auto mb-3">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--surface-4)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none"
                      stroke="var(--orange)" strokeWidth="3"
                      strokeDasharray={`${pct} ${100 - pct}`}
                      strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">{pct}%</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>Израсходовано</div>
                  <div className="text-sm font-bold text-white">{o.spent} млн ₽</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>из {o.budget} млн ₽</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
