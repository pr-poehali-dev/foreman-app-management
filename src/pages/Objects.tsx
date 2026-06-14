import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { getObjects, createObject, updateObject, deleteObject } from "@/lib/api";
import type { Obj, User } from "@/lib/api";

interface Props { user: User }

const statusLabel: Record<string, string> = { active: "В работе", paused: "Приостановлен", done: "Завершён" };
const tagColors: Record<string, string> = {
  "Жилой": "text-blue-400 bg-blue-400/10",
  "Коммерческий": "text-purple-400 bg-purple-400/10",
  "Гос. заказ": "text-cyan-400 bg-cyan-400/10",
  "Промышленный": "text-yellow-400 bg-yellow-400/10",
};

const emptyForm = { name: '', address: '', status: 'active', tag: '', progress: 0, deadline: '', budget: 0, foreman_id: 0 };

export default function Objects({ user }: Props) {
  const [objects, setObjects] = useState<Obj[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Obj | null>(null);
  const [form, setForm] = useState<typeof emptyForm>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      const data = await getObjects();
      setObjects(data);
    } catch { /* offline — показываем кэш */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() { setEditing(null); setForm({ ...emptyForm }); setError(''); setShowForm(true); }
  function openEdit(o: Obj) { setEditing(o); setForm({ name: o.name, address: o.address, status: o.status, tag: o.tag, progress: o.progress, deadline: o.deadline?.split('T')[0] || '', budget: o.budget, foreman_id: o.foreman_id }); setError(''); setShowForm(true); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (editing) {
        const updated = await updateObject(editing.id, form);
        setObjects(prev => prev.map(o => o.id === editing.id ? { ...o, ...updated } : o));
      } else {
        const created = await createObject(form);
        setObjects(prev => [created, ...prev]);
      }
      setShowForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally { setSaving(false); }
  }

  async function remove(id: number) {
    if (!confirm('Удалить объект?')) return;
    try {
      await deleteObject(id);
      setObjects(prev => prev.filter(o => o.id !== id));
    } catch (err: unknown) { alert(err instanceof Error ? err.message : 'Ошибка'); }
  }

  const filtered = objects.filter(o => {
    if (filter !== "all" && o.status !== filter) return false;
    if (search && !o.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-oswald font-bold text-white tracking-wide">ОБЪЕКТЫ</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {objects.filter(o => o.status === "active").length} активных из {objects.length}
          </p>
        </div>
        {user.role === 'manager' && (
          <button onClick={openCreate} className="btn-orange flex items-center gap-2 text-sm">
            <Icon name="Plus" size={16} />Новый объект
          </button>
        )}
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск объекта..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "var(--surface-3)", border: "1px solid var(--surface-4)", color: "var(--text-primary)" }} />
        </div>
        {[["all","Все"],["active","В работе"],["paused","Приостановлен"],["done","Завершён"]].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${filter === val ? "btn-orange" : ""}`}
            style={filter !== val ? { background: "var(--surface-3)", color: "var(--text-secondary)", border: "1px solid var(--surface-4)" } : {}}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1,2,3].map(i => <div key={i} className="skeleton h-40 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: "var(--text-muted)" }}>
          <Icon name="Building2" size={40} />
          <p className="text-sm">{objects.length === 0 ? "Объектов пока нет" : "Ничего не найдено"}</p>
          {user.role === 'manager' && objects.length === 0 && (
            <button onClick={openCreate} className="btn-orange text-sm mt-2">Создать первый объект</button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 animate-stagger">
          {filtered.map(obj => (
            <div key={obj.id} className="app-card p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h3 className="font-oswald text-lg font-semibold text-white">{obj.name}</h3>
                    {obj.tag && <span className={`status-badge ${tagColors[obj.tag] || 'bg-white/10 text-white/60'}`}>{obj.tag}</span>}
                  </div>
                  {obj.address && (
                    <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                      <Icon name="MapPin" size={13} />{obj.address}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <span className={`status-badge ${obj.status === "active" ? "status-active" : obj.status === "paused" ? "status-paused" : "status-done"}`}>
                    {statusLabel[obj.status] || obj.status}
                  </span>
                  {user.role === 'manager' && (
                    <>
                      <button onClick={() => openEdit(obj)} className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}>
                        <Icon name="Pencil" size={14} />
                      </button>
                      <button onClick={() => remove(obj.id)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:text-red-400 transition-colors"
                        style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}>
                        <Icon name="Trash2" size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  <span>Прогресс</span>
                  <span className="font-semibold" style={{ color: obj.progress === 100 ? "var(--green)" : "var(--orange)" }}>{obj.progress || 0}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${obj.progress || 0}%`, background: obj.progress === 100 ? "var(--green)" : undefined }} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: "User", label: "Прораб", val: obj.foreman_name || "—" },
                  { icon: "Calendar", label: "Срок", val: obj.deadline ? new Date(obj.deadline).toLocaleDateString('ru') : "—" },
                  { icon: "Banknote", label: "Бюджет", val: obj.budget ? `${obj.budget} ₽` : "—" },
                ].map(m => (
                  <div key={m.label} className="rounded-xl p-3" style={{ background: "var(--surface-3)" }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon name={m.icon} fallback="Circle" size={13} style={{ color: "var(--orange)" }} />
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{m.label}</span>
                    </div>
                    <p className="text-sm font-semibold text-white truncate">{m.val}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-lg animate-fade-in">
            <div className="app-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-oswald text-xl font-bold text-white">{editing ? 'РЕДАКТИРОВАТЬ' : 'НОВЫЙ ОБЪЕКТ'}</h2>
                <button onClick={() => setShowForm(false)} style={{ color: "var(--text-muted)" }}>
                  <Icon name="X" size={18} />
                </button>
              </div>
              <form onSubmit={save} className="flex flex-col gap-3">
                {[
                  { key: 'name', label: 'Название *', placeholder: 'ЖК «Северный берег»' },
                  { key: 'address', label: 'Адрес', placeholder: 'ул. Ленина, 42' },
                  { key: 'tag', label: 'Тег', placeholder: 'Жилой, Коммерческий...' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: "var(--text-muted)" }}>{f.label}</label>
                    <input value={(form as Record<string,unknown>)[f.key] as string} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder} required={f.key === 'name'}
                      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: "var(--surface-3)", border: "1px solid var(--surface-4)", color: "var(--text-primary)" }} />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: "var(--text-muted)" }}>Статус</label>
                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: "var(--surface-3)", border: "1px solid var(--surface-4)", color: "var(--text-primary)" }}>
                      <option value="active">В работе</option>
                      <option value="paused">Приостановлен</option>
                      <option value="done">Завершён</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: "var(--text-muted)" }}>Прогресс %</label>
                    <input type="number" min="0" max="100" value={form.progress}
                      onChange={e => setForm(p => ({ ...p, progress: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: "var(--surface-3)", border: "1px solid var(--surface-4)", color: "var(--text-primary)" }} />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: "var(--text-muted)" }}>Срок</label>
                    <input type="date" value={form.deadline}
                      onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: "var(--surface-3)", border: "1px solid var(--surface-4)", color: "var(--text-primary)" }} />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: "var(--text-muted)" }}>Бюджет ₽</label>
                    <input type="number" min="0" value={form.budget}
                      onChange={e => setForm(p => ({ ...p, budget: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: "var(--surface-3)", border: "1px solid var(--surface-4)", color: "var(--text-primary)" }} />
                  </div>
                </div>
                {error && (
                  <div className="px-3 py-2 rounded-xl text-sm flex items-center gap-2"
                    style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                    <Icon name="AlertCircle" size={14} />{error}
                  </div>
                )}
                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm"
                    style={{ background: "var(--surface-3)", color: "var(--text-secondary)", border: "1px solid var(--surface-4)" }}>
                    Отмена
                  </button>
                  <button type="submit" disabled={saving} className="flex-1 btn-orange py-2.5 text-sm font-bold flex items-center justify-center gap-2">
                    {saving ? <><Icon name="Loader2" size={14} className="animate-spin" />Сохранение...</> : <><Icon name="Check" size={14} />Сохранить</>}
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
