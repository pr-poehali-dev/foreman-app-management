import { useState } from "react";
import Icon from "@/components/ui/icon";

const photos = [
  { id: 1, url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80", caption: "Армирование фундамента", date: "14.06.2026", object: "ЖК «Северный берег»", stage: "Фундамент" },
  { id: 2, url: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=400&q=80", caption: "Монтаж перекрытий 3 этаж", date: "13.06.2026", object: "БЦ «Меридиан»", stage: "Каркас" },
  { id: 3, url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&q=80", caption: "Кровельные работы", date: "12.06.2026", object: "Школа №47", stage: "Кровля" },
  { id: 4, url: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=80", caption: "Фасадные работы секция А", date: "11.06.2026", object: "ЖК «Северный берег»", stage: "Фасад" },
  { id: 5, url: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&q=80", caption: "Прокладка коммуникаций", date: "10.06.2026", object: "БЦ «Меридиан»", stage: "Инженерия" },
  { id: 6, url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80", caption: "Бетонирование плиты", date: "09.06.2026", object: "ЖК «Северный берег»", stage: "Фундамент" },
  { id: 7, url: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=400&q=80", caption: "Внутренняя отделка холл", date: "08.06.2026", object: "Школа №47", stage: "Отделка" },
  { id: 8, url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&q=80", caption: "Установка окон", date: "07.06.2026", object: "БЦ «Меридиан»", stage: "Фасад" },
];

const stages = ["Все", "Фундамент", "Каркас", "Кровля", "Фасад", "Инженерия", "Отделка"];

export default function Photos() {
  const [filter, setFilter] = useState("Все");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<typeof photos[0] | null>(null);

  const filtered = photos.filter(p => filter === "Все" || p.stage === filter);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-oswald font-bold text-white tracking-wide">ФОТООТЧЁТЫ</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{photos.length} фото</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView(view === "grid" ? "list" : "grid")}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "var(--surface-3)", color: "var(--text-secondary)", border: "1px solid var(--surface-4)" }}>
            <Icon name={view === "grid" ? "LayoutList" : "Grid3X3"} size={16} />
          </button>
          <button className="btn-orange flex items-center gap-2 text-sm">
            <Icon name="Camera" size={16} />
            Добавить фото
          </button>
        </div>
      </div>

      {/* Stage filter */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {stages.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${filter === s ? "btn-orange" : ""}`}
            style={filter !== s ? { background: "var(--surface-3)", color: "var(--text-secondary)", border: "1px solid var(--surface-4)" } : {}}>
            {s}
          </button>
        ))}
      </div>

      {/* Grid */}
      {view === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 animate-stagger">
          {filtered.map(p => (
            <div key={p.id} onClick={() => setSelected(p)}
              className="rounded-2xl overflow-hidden cursor-pointer group relative"
              style={{ border: "1px solid var(--surface-4)" }}>
              <img src={p.url} alt={p.caption} className="w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <p className="text-white text-xs font-medium">{p.caption}</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>{p.date}</p>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="status-badge text-xs" style={{ background: "rgba(255,140,0,0.9)", color: "#000", fontWeight: 700 }}>
                  {p.stage}
                </span>
              </div>
            </div>
          ))}
          {/* Upload card */}
          <div className="rounded-2xl flex flex-col items-center justify-center aspect-square cursor-pointer transition-all hover:border-orange-500 border-2 border-dashed"
            style={{ borderColor: "var(--surface-4)", background: "var(--surface-2)" }}>
            <Icon name="Plus" size={28} style={{ color: "var(--text-muted)" }} />
            <span className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>Загрузить</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 animate-stagger">
          {filtered.map(p => (
            <div key={p.id} onClick={() => setSelected(p)}
              className="app-card p-3 flex items-center gap-4 cursor-pointer">
              <img src={p.url} alt={p.caption} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm">{p.caption}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{p.object}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="status-badge text-xs" style={{ background: "rgba(255,140,0,0.12)", color: "var(--orange)" }}>{p.stage}</span>
                <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>{p.date}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(10px)" }}
          onClick={() => setSelected(null)}>
          <div className="max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <img src={selected.url} alt={selected.caption} className="w-full rounded-2xl" />
            <div className="mt-4 flex items-start justify-between">
              <div>
                <p className="text-white font-semibold">{selected.caption}</p>
                <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{selected.object} · {selected.date}</p>
              </div>
              <div className="flex gap-2">
                <button className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--surface-3)", color: "var(--text-secondary)" }}>
                  <Icon name="Download" size={16} />
                </button>
                <button onClick={() => setSelected(null)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--surface-3)", color: "var(--text-secondary)" }}>
                  <Icon name="X" size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
