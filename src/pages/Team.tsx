import { useState } from "react";
import Icon from "@/components/ui/icon";

const team = [
  { id: 1, name: "Иванов Алексей Петрович", role: "Прораб", level: "manager", phone: "+7 912 345-67-89", objects: ["ЖК «Северный берег»"], status: "online", tasks: 8, avatar: "ИА" },
  { id: 2, name: "Петров Сергей Васильевич", role: "Прораб", level: "manager", phone: "+7 923 456-78-90", objects: ["БЦ «Меридиан»"], status: "online", tasks: 5, avatar: "ПС" },
  { id: 3, name: "Сидоров Михаил Кириллович", role: "Прораб", level: "manager", phone: "+7 934 567-89-01", objects: ["Школа №47"], status: "offline", tasks: 3, avatar: "СМ" },
  { id: 4, name: "Козлов Дмитрий Андреевич", role: "Прораб", level: "manager", phone: "+7 945 678-90-12", objects: [], status: "offline", tasks: 0, avatar: "КД" },
  { id: 5, name: "Ахметов Ринат Камилевич", role: "Каменщик", level: "worker", phone: "+7 956 789-01-23", objects: ["ЖК «Северный берег»"], status: "online", tasks: 2, avatar: "АР" },
  { id: 6, name: "Борисов Степан Петрович", role: "Сварщик", level: "worker", phone: "+7 967 890-12-34", objects: ["БЦ «Меридиан»"], status: "online", tasks: 1, avatar: "БС" },
  { id: 7, name: "Васильев Николай Олегович", role: "Плотник", level: "worker", phone: "+7 978 901-23-45", objects: ["ЖК «Северный берег»"], status: "offline", tasks: 0, avatar: "ВН" },
  { id: 8, name: "Гусев Дмитрий Леонидович", role: "Бетонщик", level: "worker", phone: "+7 989 012-34-56", objects: ["БЦ «Меридиан»"], status: "online", tasks: 3, avatar: "ГД" },
];

const avatarColors = [
  "#FF8C00","#22c55e","#3b82f6","#a855f7","#06b6d4","#f59e0b","#ef4444","#8b5cf6"
];

export default function Team() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = team.filter(m => {
    if (filter === "managers" && m.level !== "manager") return false;
    if (filter === "workers" && m.level !== "worker") return false;
    if (filter === "online" && m.status !== "online") return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const online = team.filter(m => m.status === "online").length;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-oswald font-bold text-white tracking-wide">КОМАНДА</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {team.length} чел. · <span style={{ color: "var(--green)" }}>{online} онлайн</span>
          </p>
        </div>
        <button className="btn-orange flex items-center gap-2 text-sm">
          <Icon name="UserPlus" size={16} />
          Добавить
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: "Прорабов", val: team.filter(m=>m.level==="manager").length, color: "var(--orange)" },
          { label: "Рабочих", val: team.filter(m=>m.level==="worker").length, color: "var(--blue)" },
          { label: "Онлайн", val: online, color: "var(--green)" },
          { label: "На объектах", val: team.filter(m=>m.objects.length>0).length, color: "var(--purple)" },
        ].map(s => (
          <div key={s.label} className="metric-card text-center py-4">
            <div className="text-2xl font-oswald font-bold" style={{ color: s.color }}>{s.val}</div>
            <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[["all","Все"],["managers","Прорабы"],["workers","Рабочие"],["online","Онлайн"]].map(([val, label]) => (
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
            style={{ background: "var(--surface-3)", border: "1px solid var(--surface-4)", color: "var(--text-primary)", width: 160 }} />
        </div>
      </div>

      {/* Foremen section */}
      {(filter === "all" || filter === "managers") && (
        <div className="mb-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
            Прорабы
          </h2>
          <div className="grid md:grid-cols-2 gap-3 animate-stagger">
            {filtered.filter(m => m.level === "manager").map((m, i) => (
              <div key={m.id} className="app-card p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: `${avatarColors[i % avatarColors.length]}20`, color: avatarColors[i % avatarColors.length] }}>
                  {m.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white text-sm">{m.name}</p>
                    <div className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: m.status === "online" ? "var(--green)" : "var(--text-muted)" }} />
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {m.objects.length ? m.objects[0] : "Без объекта"}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold" style={{ color: "var(--orange)" }}>{m.tasks}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>задач</div>
                </div>
                <button className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--surface-3)", color: "var(--text-secondary)" }}>
                  <Icon name="Phone" size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workers section */}
      {(filter === "all" || filter === "workers" || filter === "online") && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
            Рабочие
          </h2>
          <div className="grid md:grid-cols-2 gap-3 animate-stagger">
            {filtered.filter(m => m.level === "worker").map((m, i) => (
              <div key={m.id} className="app-card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: `${avatarColors[(i + 4) % avatarColors.length]}20`, color: avatarColors[(i + 4) % avatarColors.length] }}>
                  {m.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium text-white text-sm truncate">{m.name}</p>
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: m.status === "online" ? "var(--green)" : "var(--text-muted)" }} />
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{m.role}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-lg flex-shrink-0"
                  style={{ background: "var(--surface-3)", color: "var(--text-secondary)" }}>
                  {m.objects.length ? m.objects[0].split("«")[0].trim() : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
