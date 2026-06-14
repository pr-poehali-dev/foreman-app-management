import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { getWorkers, createWorker, updateWorker, deleteWorker, getObjects } from "@/lib/api";
import type { Worker, Obj, User } from "@/lib/api";

interface Props { user: User }

const specialties = [
  "Каменщик","Сварщик","Плотник","Бетонщик","Монтажник",
  "Электрик","Сантехник","Штукатур","Маляр","Кровельщик",
  "Арматурщик","Отделочник","Разнорабочий","Другое"
];

const emptyForm = { full_name: '', specialty: '', phone: '', object_id: 0 };

export default function Workers({ user }: Props) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [objects, setObjects] = useState<Obj[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterObj, setFilterObj] = useState<number | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Worker | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      const [ws, objs] = await Promise.all([getWorkers(), getObjects()]);
      setWorkers(ws); setObjects(objs);
    } catch { /* offline */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() { setEditing(null); setForm({ ...emptyForm }); setError(''); setShowForm(true); }
  function openEdit(w: Worker) {
    setEditing(w);
    setForm({ full_name: w.full_name, specialty: w.specialty || '', phone: w.phone || '', object_id: w.object_id || 0 });
    setError(''); setShowForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form, object_id: form.object_id || null };
      if (editing) {
        const updated = await updateWorker(editing.id, payload);
        setWorkers(prev => prev.map(w => w.id === editing.id ? { ...w, ...updated } : w));
      } else {
        const created = await createWorker(payload);
        const obj = objects.find(o => o.id === form.object_id);
        setWorkers(prev => [{ ...created, object_name: obj?.name }, ...prev]);
      }
      setShowForm(false);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
    setSaving(false);
  }

  async function remove(id: number) {
    if (!confirm('Удалить рабочего?')) return;
    try { await deleteWorker(id); setWorkers(prev => prev.filter(w => w.id !== id)); }
    catch (err: unknown) { alert(err instanceof Error ? err.message : 'Ошибка'); }
  }

  const filtered = workers.filter(w => {
    if (filterObj !== 'all' && filterObj !== 0 && w.object_id !== filterObj) return false;
    if (filterObj === 0 && w.object_id) return false;
    if (search && !w.full_name.toLowerCase().includes(search.toLowerCase()) &&
        !(w.specialty || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Группировка по объектам
  const grouped: Record<string, Worker[]> = {};
  filtered.forEach(w => {
    const key = w.object_name || '__none__';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(w);
  });

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-oswald font-bold text-white tracking-wide">РАБОЧИЕ</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {workers.length} чел.
            {workers.filter(w => w.object_id).length > 0 && (
              <span style={{ color: "var(--green)" }}> · {workers.filter(w => w.object_id).length} на объектах</span>
            )}
          </p>
        </div>
        <button onClick={openCreate} className="btn-orange flex items-center gap-2 text-sm min-h-[44px] px-4">
          <Icon name="UserPlus" size={16} />Добавить
        </button>
      </div>

      {/* Статистика */}
      {workers.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
          {[
            { label: "Всего", val: workers.length, color: "var(--orange)", icon: "HardHat" },
            { label: "На объектах", val: workers.filter(w => w.object_id).length, color: "var(--green)", icon: "Building2" },
            { label: "Свободны", val: workers.filter(w => !w.object_id).length, color: "var(--blue)", icon: "UserX" },
          ].map(s => (
            <div key={s.label} className="metric-card flex flex-col items-center justify-center py-3 text-center">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2 mx-auto"
                style={{ background: `${s.color}20` }}>
                <Icon name={s.icon} fallback="Circle" size={16} style={{ color: s.color }} />
              </div>
              <div className="text-xl sm:text-2xl font-oswald font-bold text-white">{s.val}</div>
              <div className="text-[10px] sm:text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Фильтры */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск..."
            className="w-full pl-9 pr-4 py-3 rounded-xl outline-none"
            style={{ background: "var(--surface-3)", border: "1px solid var(--surface-4)", color: "var(--text-primary)" }} />
        </div>
        <select value={filterObj} onChange={e => setFilterObj(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="py-3 px-4 rounded-xl outline-none"
          style={{ background: "var(--surface-3)", border: "1px solid var(--surface-4)", color: "var(--text-primary)", minHeight: 44 }}>
          <option value="all">Все объекты</option>
          <option value={0}>Без объекта</option>
          {objects.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">{[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4" style={{ color: "var(--text-muted)" }}>
          <Icon name="HardHat" size={48} />
          <p className="text-sm">{workers.length === 0 ? "Рабочие ещё не добавлены" : "Ничего не найдено"}</p>
          {workers.length === 0 && (
            <button onClick={openCreate} className="btn-orange text-sm min-h-[44px] px-5">Добавить первого</button>
          )}
        </div>
      ) : (
        Object.entries(grouped).map(([objName, ws]) => (
          <div key={objName} className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Icon name={objName === '__none__' ? "UserX" : "Building2"} size={13}
                style={{ color: objName === '__none__' ? "var(--text-muted)" : "var(--orange)" }} />
              <span className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: objName === '__none__' ? "var(--text-muted)" : "var(--orange)" }}>
                {objName === '__none__' ? 'Без объекта' : objName}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}>
                {ws.length} чел.
              </span>
            </div>
            <div className="grid sm:grid-cols-2 gap-2 sm:gap-3">
              {ws.map((w, i) => (
                <div key={w.id} className="app-card p-4 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: "rgba(255,140,0,0.12)", color: "var(--orange)" }}>
                    {w.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{w.full_name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {w.specialty && (
                        <span className="text-xs px-2 py-0.5 rounded-lg"
                          style={{ background: "var(--surface-3)", color: "var(--text-secondary)" }}>
                          {w.specialty}
                        </span>
                      )}
                      {w.phone && (
                        <a href={`tel:${w.phone}`} className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {w.phone}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(w)}
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}>
                      <Icon name="Pencil" size={15} />
                    </button>
                    <button onClick={() => remove(w.id)}
                      className="w-10 h-10 rounded-xl flex items-center justify-center hover:text-red-400 transition-colors"
                      style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}>
                      <Icon name="Trash2" size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
          onClick={() => setShowForm(false)}>
          <div className="w-full sm:max-w-md animate-fade-in" onClick={e => e.stopPropagation()}
            style={{ maxHeight: "90dvh", overflowY: "auto" }}>
            <div className="app-card p-5 rounded-t-2xl rounded-b-none sm:rounded-2xl">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(255,140,0,0.15)" }}>
                  <Icon name="HardHat" size={18} style={{ color: "var(--orange)" }} />
                </div>
                <h2 className="font-oswald text-xl font-bold text-white flex-1">
                  {editing ? 'РЕДАКТИРОВАТЬ' : 'НОВЫЙ РАБОЧИЙ'}
                </h2>
                <button onClick={() => setShowForm(false)} className="w-10 h-10 flex items-center justify-center rounded-xl"
                  style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}>
                  <Icon name="X" size={18} />
                </button>
              </div>
              <form onSubmit={save} className="flex flex-col gap-4">
                {[
                  { key: 'full_name', label: 'ФИО *', placeholder: 'Иванов Иван Иванович', icon: 'User' },
                  { key: 'phone', label: 'Телефон', placeholder: '+7 900 000-00-00', icon: 'Phone' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs uppercase tracking-widest mb-1.5 block" style={{ color: "var(--text-muted)" }}>{f.label}</label>
                    <div className="relative">
                      <Icon name={f.icon} fallback="Circle" size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                      <input value={(form as Record<string, unknown>)[f.key] as string}
                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder} required={f.key === 'full_name'}
                        className="w-full pl-9 pr-4 py-3 rounded-xl outline-none"
                        style={{ background: "var(--surface-3)", border: "1px solid var(--surface-4)", color: "var(--text-primary)" }} />
                    </div>
                  </div>
                ))}
                <div>
                  <label className="text-xs uppercase tracking-widest mb-1.5 block" style={{ color: "var(--text-muted)" }}>Специальность</label>
                  <select value={form.specialty} onChange={e => setForm(p => ({ ...p, specialty: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl outline-none"
                    style={{ background: "var(--surface-3)", border: "1px solid var(--surface-4)", color: "var(--text-primary)" }}>
                    <option value="">Выберите специальность</option>
                    {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest mb-1.5 block" style={{ color: "var(--text-muted)" }}>Объект</label>
                  <select value={form.object_id || ''} onChange={e => setForm(p => ({ ...p, object_id: Number(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 rounded-xl outline-none"
                    style={{ background: "var(--surface-3)", border: "1px solid var(--surface-4)", color: "var(--text-primary)" }}>
                    <option value="">— Без объекта —</option>
                    {objects.filter(o => o.status !== 'done').map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                  {form.object_id ? (
                    <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: "var(--green)" }}>
                      <Icon name="CheckCircle2" size={11} />Появится в табеле объекта
                    </p>
                  ) : null}
                </div>
                {error && (
                  <div className="px-3 py-2.5 rounded-xl text-sm flex items-center gap-2"
                    style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                    <Icon name="AlertCircle" size={14} />{error}
                  </div>
                )}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 py-3 rounded-xl text-sm"
                    style={{ background: "var(--surface-3)", color: "var(--text-secondary)", border: "1px solid var(--surface-4)" }}>
                    Отмена
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 btn-orange py-3 text-sm font-bold flex items-center justify-center gap-2">
                    {saving ? <><Icon name="Loader2" size={15} className="animate-spin" />Сохранение...</> : <><Icon name="UserPlus" size={15} />{editing ? 'Сохранить' : 'Добавить'}</>}
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
