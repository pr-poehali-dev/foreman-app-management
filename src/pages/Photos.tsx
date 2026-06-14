import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { getPhotos, addPhoto } from "@/lib/api";
import type { Photo, User } from "@/lib/api";

interface Props { user: User }
const stages = ["Все", "Фундамент", "Каркас", "Кровля", "Фасад", "Инженерия", "Отделка", "Прочее"];

export default function Photos({ user }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Все");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<Photo | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ caption: '', photo_url: '', stage: 'Прочее' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try { setPhotos(await getPhotos()); } catch { /* offline */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const created = await addPhoto(form);
      setPhotos(prev => [created, ...prev]);
      setShowForm(false);
      setForm({ caption: '', photo_url: '', stage: 'Прочее' });
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
    setSaving(false);
  }

  const filtered = photos.filter(p => filter === "Все" || p.stage === filter);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-oswald font-bold text-white tracking-wide">ФОТООТЧЁТЫ</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{photos.length} фото</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView(view === "grid" ? "list" : "grid")}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "var(--surface-3)", color: "var(--text-secondary)", border: "1px solid var(--surface-4)" }}>
            <Icon name={view === "grid" ? "LayoutList" : "Grid3X3"} size={16} />
          </button>
          <button onClick={() => setShowForm(true)} className="btn-orange flex items-center gap-2 text-sm">
            <Icon name="Camera" size={16} />Добавить
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {stages.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${filter === s ? "btn-orange" : ""}`}
            style={filter !== s ? { background: "var(--surface-3)", color: "var(--text-secondary)", border: "1px solid var(--surface-4)" } : {}}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-3">{[1,2,3,4,5,6].map(i => <div key={i} className="skeleton aspect-square rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: "var(--text-muted)" }}>
          <Icon name="Camera" size={40} />
          <p className="text-sm">Фото пока нет</p>
          <button onClick={() => setShowForm(true)} className="btn-orange text-sm mt-2">Добавить первое фото</button>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 animate-stagger">
          {filtered.map(p => (
            <div key={p.id} onClick={() => setSelected(p)}
              className="rounded-2xl overflow-hidden cursor-pointer group relative aspect-square"
              style={{ border: "1px solid var(--surface-4)", background: "var(--surface-3)" }}>
              <img src={p.photo_url} alt={p.caption} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <p className="text-white text-xs font-medium">{p.caption}</p>
              </div>
            </div>
          ))}
          <div onClick={() => setShowForm(true)}
            className="rounded-2xl flex flex-col items-center justify-center aspect-square cursor-pointer border-2 border-dashed transition-all hover:border-orange-400"
            style={{ borderColor: "var(--surface-4)", background: "var(--surface-2)" }}>
            <Icon name="Plus" size={28} style={{ color: "var(--text-muted)" }} />
            <span className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>Загрузить</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 animate-stagger">
          {filtered.map(p => (
            <div key={p.id} onClick={() => setSelected(p)} className="app-card p-3 flex items-center gap-4 cursor-pointer">
              <img src={p.photo_url} alt={p.caption} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm">{p.caption}</p>
                {p.object_name && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{p.object_name}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                {p.stage && <span className="status-badge text-xs" style={{ background: "rgba(255,140,0,0.12)", color: "var(--orange)" }}>{p.stage}</span>}
                {p.created_at && <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>{new Date(p.created_at).toLocaleDateString('ru')}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(10px)" }}
          onClick={() => setSelected(null)}>
          <div className="max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <img src={selected.photo_url} alt={selected.caption} className="w-full rounded-2xl" />
            <div className="mt-4 flex items-start justify-between">
              <div>
                <p className="text-white font-semibold">{selected.caption}</p>
                <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  {selected.object_name} {selected.created_at ? `· ${new Date(selected.created_at).toLocaleDateString('ru')}` : ''}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="w-9 h-9 rounded-xl flex items-center justify-center ml-3"
                style={{ background: "var(--surface-3)", color: "var(--text-secondary)" }}>
                <Icon name="X" size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-md animate-fade-in">
            <div className="app-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-oswald text-xl font-bold text-white">ДОБАВИТЬ ФОТО</h2>
                <button onClick={() => setShowForm(false)} style={{ color: "var(--text-muted)" }}><Icon name="X" size={18} /></button>
              </div>
              <form onSubmit={save} className="flex flex-col gap-3">
                <div>
                  <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: "var(--text-muted)" }}>Ссылка на фото *</label>
                  <input value={form.photo_url} onChange={e => setForm(p => ({ ...p, photo_url: e.target.value }))} required
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--surface-3)", border: "1px solid var(--surface-4)", color: "var(--text-primary)" }} />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: "var(--text-muted)" }}>Описание</label>
                  <input value={form.caption} onChange={e => setForm(p => ({ ...p, caption: e.target.value }))}
                    placeholder="Армирование фундамента"
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--surface-3)", border: "1px solid var(--surface-4)", color: "var(--text-primary)" }} />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: "var(--text-muted)" }}>Этап</label>
                  <select value={form.stage} onChange={e => setForm(p => ({ ...p, stage: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--surface-3)", border: "1px solid var(--surface-4)", color: "var(--text-primary)" }}>
                    {stages.filter(s => s !== "Все").map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {error && <div className="px-3 py-2 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>{error}</div>}
                <div className="flex gap-3 mt-1">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm"
                    style={{ background: "var(--surface-3)", color: "var(--text-secondary)", border: "1px solid var(--surface-4)" }}>
                    Отмена
                  </button>
                  <button type="submit" disabled={saving} className="flex-1 btn-orange py-2.5 text-sm font-bold flex items-center justify-center gap-2">
                    {saving ? <><Icon name="Loader2" size={14} className="animate-spin" />Сохранение...</> : <><Icon name="Camera" size={14} />Добавить</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
