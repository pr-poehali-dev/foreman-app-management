import { useState } from "react";
import Icon from "@/components/ui/icon";

const objects = [
  {
    id: 1, name: "ЖК «Северный берег»", address: "ул. Ленина, 42",
    status: "active", progress: 67, workers: 12, foreman: "Иванов А.П.",
    deadline: "15.09.2026", budget: "18.4 млн ₽", tag: "Жилой"
  },
  {
    id: 2, name: "БЦ «Меридиан»", address: "пр. Победы, 18",
    status: "active", progress: 34, workers: 8, foreman: "Петров С.В.",
    deadline: "01.12.2026", budget: "42.1 млн ₽", tag: "Коммерческий"
  },
  {
    id: 3, name: "Школа №47", address: "ул. Садовая, 5",
    status: "paused", progress: 89, workers: 5, foreman: "Сидоров М.К.",
    deadline: "30.06.2026", budget: "9.8 млн ₽", tag: "Гос. заказ"
  },
  {
    id: 4, name: "Склад «Логистика»", address: "пос. Мирный, 3",
    status: "done", progress: 100, workers: 0, foreman: "Козлов Д.А.",
    deadline: "01.03.2026", budget: "6.2 млн ₽", tag: "Промышленный"
  },
];

const statusLabel: Record<string, string> = {
  active: "В работе", paused: "Приостановлен", done: "Завершён"
};

const tagColors: Record<string, string> = {
  "Жилой": "text-blue-400 bg-blue-400/10",
  "Коммерческий": "text-purple-400 bg-purple-400/10",
  "Гос. заказ": "text-cyan-400 bg-cyan-400/10",
  "Промышленный": "text-yellow-400 bg-yellow-400/10",
};

export default function Objects() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = objects.filter(o => {
    if (filter !== "all" && o.status !== filter) return false;
    if (search && !o.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-oswald font-bold text-white tracking-wide">ОБЪЕКТЫ</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {objects.filter(o => o.status === "active").length} активных из {objects.length}
          </p>
        </div>
        <button className="btn-orange flex items-center gap-2 text-sm">
          <Icon name="Plus" size={16} />
          Новый объект
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск объекта..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "var(--surface-3)", border: "1px solid var(--surface-4)", color: "var(--text-primary)" }}
          />
        </div>
        {[["all","Все"],["active","В работе"],["paused","Приостановлен"],["done","Завершён"]].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${filter === val ? "btn-orange" : ""}`}
            style={filter !== val ? { background: "var(--surface-3)", color: "var(--text-secondary)", border: "1px solid var(--surface-4)" } : {}}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="grid gap-4 animate-stagger">
        {filtered.map(obj => (
          <div key={obj.id} className="app-card p-5 cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-oswald text-lg font-semibold text-white">{obj.name}</h3>
                  <span className={`status-badge ${tagColors[obj.tag]}`}>{obj.tag}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                  <Icon name="MapPin" size={13} />
                  {obj.address}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <span className={`status-badge ${obj.status === "active" ? "status-active" : obj.status === "paused" ? "status-paused" : "status-done"}`}>
                  {statusLabel[obj.status]}
                </span>
                <Icon name="ChevronRight" size={18} style={{ color: "var(--text-muted)" }} />
              </div>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--text-secondary)" }}>
                <span>Прогресс</span>
                <span className="font-semibold" style={{ color: obj.progress === 100 ? "var(--green)" : "var(--orange)" }}>{obj.progress}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${obj.progress}%`, background: obj.progress === 100 ? "var(--green)" : undefined }} />
              </div>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: "HardHat", label: "Прораб", val: obj.foreman.split(" ")[0] + " " + obj.foreman.split(" ")[1]?.[0] + "." },
                { icon: "Users", label: "Рабочих", val: obj.workers + " чел." },
                { icon: "Calendar", label: "Срок", val: obj.deadline },
              ].map(m => (
                <div key={m.label} className="rounded-xl p-3" style={{ background: "var(--surface-3)" }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon name={m.icon} fallback="Circle" size={13} style={{ color: "var(--orange)" }} />
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{m.label}</span>
                  </div>
                  <p className="text-sm font-semibold text-white">{m.val}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}