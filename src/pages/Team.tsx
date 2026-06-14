import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { getTeam } from "@/lib/api";
import type { User } from "@/lib/api";

interface Props { user: User; onRegisterClick?: () => void }

const avatarColors = ["#FF8C00","#22c55e","#3b82f6","#a855f7","#06b6d4","#f59e0b","#ef4444","#8b5cf6"];

export default function Team({ user, onRegisterClick }: Props) {
  const [team, setTeam] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  async function load() {
    try { setTeam(await getTeam()); } catch { /* offline */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = team.filter(m => {
    if (filter === "managers" && m.role !== "manager") return false;
    if (filter === "workers" && m.role !== "foreman") return false;
    if (search && !m.full_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const managers = filtered.filter(m => m.role === 'manager');
  const foremans = filtered.filter(m => m.role === 'foreman');

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-oswald font-bold text-white tracking-wide">КОМАНДА</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {team.length} чел.
          </p>
        </div>
        {user.role === 'manager' && onRegisterClick && (
          <button onClick={onRegisterClick} className="btn-orange flex items-center gap-2 text-sm">
            <Icon name="UserPlus" size={16} />Добавить прораба
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Управленцев", val: team.filter(m => m.role === 'manager').length, color: "var(--orange)" },
          { label: "Прорабов", val: team.filter(m => m.role === 'foreman').length, color: "var(--blue)" },
          { label: "Активных", val: team.filter(m => m.is_active !== false).length, color: "var(--green)" },
        ].map(s => (
          <div key={s.label} className="metric-card text-center py-4">
            <div className="text-2xl font-oswald font-bold" style={{ color: s.color }}>{s.val}</div>
            <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[["all","Все"],["managers","Управленцы"],["workers","Прорабы"]].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${filter === val ? "btn-orange" : ""}`}
            style={filter !== val ? { background: "var(--surface-3)", color: "var(--text-secondary)", border: "1px solid var(--surface-4)" } : {}}>
            {label}
          </button>
        ))}
        <div className="relative ml-auto">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск..."
            className="pl-8 pr-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "var(--surface-3)", border: "1px solid var(--surface-4)", color: "var(--text-primary)", width: 150 }} />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">{[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
      ) : (
        <>
          {managers.length > 0 && (
            <div className="mb-5">
              <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>Управленцы</h2>
              <div className="grid md:grid-cols-2 gap-3 animate-stagger">
                {managers.map((m, i) => (
                  <div key={m.id} className="app-card p-4 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: `${avatarColors[i % avatarColors.length]}20`, color: avatarColors[i % avatarColors.length] }}>
                      {m.full_name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm">{m.full_name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>@{m.login}</p>
                    </div>
                    <span className="status-badge text-xs" style={{ background: "rgba(255,140,0,0.12)", color: "var(--orange)" }}>Управленец</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {foremans.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>Прорабы</h2>
              <div className="grid md:grid-cols-2 gap-3 animate-stagger">
                {foremans.map((m, i) => (
                  <div key={m.id} className="app-card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: `${avatarColors[(i + 3) % avatarColors.length]}20`, color: avatarColors[(i + 3) % avatarColors.length] }}>
                      {m.full_name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm truncate">{m.full_name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>@{m.login}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {m.phone && (
                        <a href={`tel:${m.phone}`} className="w-8 h-8 rounded-xl flex items-center justify-center"
                          style={{ background: "var(--surface-3)", color: "var(--text-secondary)" }}>
                          <Icon name="Phone" size={14} />
                        </a>
                      )}
                      <span className={`w-2 h-2 rounded-full`}
                        style={{ background: m.is_active !== false ? "var(--green)" : "var(--text-muted)" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: "var(--text-muted)" }}>
              <Icon name="Users" size={40} />
              <p className="text-sm">Сотрудники не найдены</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
