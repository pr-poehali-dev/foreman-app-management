import { useState } from "react";
import Icon from "@/components/ui/icon";

const docs = [
  { id: 1, name: "Акт выполненных работ №12", type: "pdf", size: "1.2 МБ", date: "12.06.2026", object: "ЖК «Северный берег»", category: "Акты" },
  { id: 2, name: "Смета на отделочные работы", type: "xlsx", size: "340 КБ", date: "10.06.2026", object: "БЦ «Меридиан»", category: "Сметы" },
  { id: 3, name: "Проектная документация фундамент", type: "pdf", size: "8.7 МБ", date: "05.06.2026", object: "ЖК «Северный берег»", category: "Проект" },
  { id: 4, name: "Журнал бетонных работ", type: "pdf", size: "560 КБ", date: "03.06.2026", object: "Школа №47", category: "Журналы" },
  { id: 5, name: "Договор субподряда", type: "docx", size: "210 КБ", date: "28.05.2026", object: "БЦ «Меридиан»", category: "Договоры" },
  { id: 6, name: "Сертификат бетона М300", type: "pdf", size: "125 КБ", date: "25.05.2026", object: "ЖК «Северный берег»", category: "Сертификаты" },
  { id: 7, name: "Акт скрытых работ №8", type: "pdf", size: "890 КБ", date: "22.05.2026", object: "Школа №47", category: "Акты" },
  { id: 8, name: "План производства работ", type: "pdf", size: "2.1 МБ", date: "15.05.2026", object: "БЦ «Меридиан»", category: "Проект" },
];

const categories = ["Все", "Акты", "Сметы", "Проект", "Журналы", "Договоры", "Сертификаты"];

const fileIcons: Record<string, { icon: string; color: string; bg: string }> = {
  pdf:  { icon: "FileText", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  xlsx: { icon: "FileSpreadsheet", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  docx: { icon: "FileType", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
};

export default function Documents() {
  const [cat, setCat] = useState("Все");
  const [search, setSearch] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const filtered = docs.filter(d => {
    if (cat !== "Все" && d.category !== cat) return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-oswald font-bold text-white tracking-wide">ДОКУМЕНТЫ</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{docs.length} файлов</p>
        </div>
        <button className="btn-orange flex items-center gap-2 text-sm">
          <Icon name="Upload" size={16} />
          Загрузить
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={() => setDragOver(false)}
        className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center py-8 mb-5 transition-all cursor-pointer"
        style={{
          borderColor: dragOver ? "var(--orange)" : "var(--surface-4)",
          background: dragOver ? "rgba(255,140,0,0.06)" : "var(--surface-2)"
        }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
          style={{ background: dragOver ? "rgba(255,140,0,0.15)" : "var(--surface-3)" }}>
          <Icon name="Upload" size={22} style={{ color: dragOver ? "var(--orange)" : "var(--text-muted)" }} />
        </div>
        <p className="text-sm font-medium" style={{ color: dragOver ? "var(--orange)" : "var(--text-secondary)" }}>
          Перетащите файлы сюда
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>PDF, DOCX, XLSX, PNG — до 50 МБ</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {categories.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${cat === c ? "btn-orange" : ""}`}
            style={cat !== c ? { background: "var(--surface-3)", color: "var(--text-secondary)", border: "1px solid var(--surface-4)" } : {}}>
            {c}
          </button>
        ))}
        <div className="relative ml-auto min-w-[180px]">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск..."
            className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: "var(--surface-3)", border: "1px solid var(--surface-4)", color: "var(--text-primary)" }} />
        </div>
      </div>

      {/* List */}
      <div className="flex flex-col gap-2 animate-stagger">
        {filtered.map(doc => {
          const fi = fileIcons[doc.type] ?? fileIcons.pdf;
          return (
            <div key={doc.id} className="app-card p-4 flex items-center gap-4 cursor-pointer group">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: fi.bg }}>
                <Icon name={fi.icon} fallback="File" size={20} style={{ color: fi.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm truncate">{doc.name}</p>
                <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  <span>{doc.object}</span>
                  <span>•</span>
                  <span>{doc.size}</span>
                  <span>•</span>
                  <span>{doc.date}</span>
                </div>
              </div>
              <span className="status-badge text-xs" style={{ background: "var(--surface-3)", color: "var(--text-secondary)" }}>
                {doc.category}
              </span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:text-orange-400"
                  style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}>
                  <Icon name="Download" size={14} />
                </button>
                <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:text-red-400"
                  style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}>
                  <Icon name="Trash2" size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
