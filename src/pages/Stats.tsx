import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { getStats } from "@/lib/api";
import type { Stats as StatsType, User } from "@/lib/api";

interface Props { user: User }

const colorMap: Record<string, string> = {
  orange: "var(--orange)", green: "var(--green)", blue: "var(--blue)", purple: "var(--purple)",
};
const bgMap: Record<string, string> = {
  orange: "rgba(255,140,0,0.12)", green: "rgba(34,197,94,0.12)", blue: "rgba(59,130,246,0.12)", purple: "rgba(168,85,247,0.12)",
};

export default function Stats({ user }: Props) {
  const [stats, setStats] = useState<StatsType | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try { setStats(await getStats()); } catch { /* offline */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const metrics = stats ? [
    { label: "Объектов в работе", val: String(stats.active_objects), icon: "Building2", color: "orange" },
    { label: "Рабочих", val: String((stats as unknown as Record<string,unknown>).workers ?? stats.foremans), icon: "HardHat", color: "blue" },
    { label: "На объекте сегодня", val: String(stats.on_site_today), icon: "CheckCircle2", color: "green" },
    { label: "Документов", val: String(stats.documents), icon: "FileText", color: "purple" },
  ] : [];

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-oswald font-bold text-white tracking-wide">СТАТИСТИКА</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            Дашборд {user.role === 'manager' ? 'управленца' : 'прораба'}
          </p>
        </div>
        <button onClick={load} className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--surface-3)", color: "var(--text-secondary)", border: "1px solid var(--surface-4)" }}>
          <Icon name="RefreshCw" size={15} />
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5 animate-stagger">
          {metrics.map(m => (
            <div key={m.label} className={`metric-card ${m.color}`}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: bgMap[m.color] }}>
                <Icon name={m.icon} fallback="Circle" size={18} style={{ color: colorMap[m.color] }} />
              </div>
              <div className="text-2xl font-oswald font-bold text-white">{m.val}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{m.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Objects progress */}
      {stats && stats.objects && stats.objects.length > 0 && (
        <div className="app-card p-5 mb-4">
          <h3 className="font-oswald text-base font-semibold text-white mb-4">Прогресс объектов</h3>
          <div className="flex flex-col gap-4">
            {stats.objects.map(o => (
              <div key={o.id}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-white truncate max-w-[60%]">{o.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{
                      background: o.status === 'active' ? 'rgba(34,197,94,0.12)' : o.status === 'done' ? 'rgba(148,163,184,0.1)' : 'rgba(245,158,11,0.12)',
                      color: o.status === 'active' ? 'var(--green)' : o.status === 'done' ? 'var(--text-muted)' : '#f59e0b',
                    }}>
                      {o.status === 'active' ? 'В работе' : o.status === 'done' ? 'Завершён' : 'Пауза'}
                    </span>
                    <span className="font-bold" style={{ color: "var(--orange)" }}>{o.progress || 0}%</span>
                  </div>
                </div>
                <div className="progress-bar mb-1">
                  <div className="progress-fill" style={{ width: `${o.progress || 0}%`, background: o.progress === 100 ? "var(--green)" : undefined }} />
                </div>
                {o.foreman_name && <p className="text-xs" style={{ color: "var(--text-muted)" }}>Прораб: {o.foreman_name}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {stats && stats.objects && stats.objects.length === 0 && (
        <div className="app-card p-10 flex flex-col items-center gap-3" style={{ color: "var(--text-muted)" }}>
          <Icon name="Building2" size={40} />
          <p className="text-sm">Объекты пока не добавлены</p>
          {user.role === 'manager' && (
            <p className="text-xs text-center">Перейдите в раздел «Объекты» чтобы добавить первый объект</p>
          )}
        </div>
      )}

      {/* Additional info */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="app-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,140,0,0.12)" }}>
              <Icon name="Camera" size={18} style={{ color: "var(--orange)" }} />
            </div>
            <div>
              <div className="text-xl font-oswald font-bold text-white">{stats.photos}</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>Фотоотчётов</div>
            </div>
          </div>
          <div className="app-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(59,130,246,0.12)" }}>
              <Icon name="MessageSquare" size={18} style={{ color: "var(--blue)" }} />
            </div>
            <div>
              <div className="text-xl font-oswald font-bold text-white">{stats.messages}</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>Сообщений в чате</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}