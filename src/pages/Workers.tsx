import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { getWorkers, createWorker, updateWorker, deleteWorker, getObjects } from "@/lib/api";
import type { Worker, Obj, User } from "@/lib/api";

interface Props { user: User }

const specialties = [
  "Каменщик", "Сварщик", "Плотник", "Бетонщик", "Монтажник",
  "Электрик", "Сантехник", "Штукатур", "Маляр", "Кровельщик",
  "Арматурщик", "Отделочник", "Разнорабочий", "Другое"
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
      setWorkers(ws);
      setObjects(objs);
    } catch { /* offline */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm });
    setError('');
    setShowForm(true);
  }

  function openEdit(w: Worker) {
    setEditing(w);
    setForm({ full_name: w.full_name, specialty: w.specialty || '', phone: w.phone || '', object_id: w.object_id || 0 });
    setError('');
    setShowForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const payload = { ...form, object_id: form.object_id || null };
      if (editing) {
        const updated = await updateWorker(editing.id, payload);
        setWorkers(prev => prev.map(w => w.id === editing.id ? { ...w, ...updated } : w));
      } else {
        const created = await createWorker(payload);
        // Добавляем object_name из локального списка
        const obj = objects.find(o => o.id === form.object_id);
        setWorkers(prev => [{ ...created, object_name: obj?.name }, ...prev]);
      }
      setShowForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    }
    setSaving(false);
  }

  async function remove(id: number) {
    if (!confirm('Удалить рабочего?')) return;
    try {
      await deleteWorker(id);
      setWorkers(prev => prev.filter(w => w.id !== id));
    } catch (err: unknown) { alert(err instanceof Error ? err.message : 'Ошибка'); }
  }

  const filtered = workers.filter(w => {
    if (filterObj !== 'all' && w.object_id !== filterObj) return false;
    if (search && !w.full_name.toLowerCase().includes(search.toLowerCase()) &&
        !(w.specialty || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const specialtyCounts = specialties.reduce((acc, s) => {
    acc[s] = workers.filter(w => w.specialty === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-oswald font-bold text-white tracking-wide">РАБОЧИЕ</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {workers.length} чел.
            {workers.filter(w => w.object_id).length > 0 && (
              <span style={{ color: "var(--green)" }}> · {workers.filter(w => w.object_id).length} на объектах</span>
            )}
          </p>
        </div>
        <button onClick={openCreate} className="btn-orange flex items-center gap-2 text-sm">
          <Icon name="UserPlus" size={16} />
          Добавить рабочего
        </button>
      </div>

      {/* Stats row */}
      {workers.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Всего рабочих", val: workers.length, color: "var(--orange)", icon: "HardHat" },
            { label: "На объектах", val: workers.filter(w => w.object_id).length, color: "var(--green)", icon: "Building2" },
            { label: "Не назначены", val: workers.filter(w => !w.object_id).length, color: "var(--blue)", icon: "UserX" },
          ].map(s => (
            <div key={s.label} className="metric-card flex items-center gap-3 py-4 px-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${s.color}20` }}>
                <Icon name={s.icon} fallback="Circle" size={18} style={{ color: s.color }} />
              </div>
              <div>
                <div className="text-xl font-oswald font-bold text-white">{s.val}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="flex-1 min-w-[180px] relative">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по имени, специальности..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "var(--surface-3)", border: "1px solid var(--surface-4)", color: "var(--text-primary)" }} />
        </div>
        <select value={filterObj} onChange={e => setFilterObj(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: "var(--surface-3)", border: "1px solid var(--surface-4)", color: "var(--text-primary)" }}>
          <option value="all">Все объекты</option>
          <option value={0}>Без объекта</option>
          {objects.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4" style={{ color: "var(--text-muted)" }}>
          <Icon name="HardHat" size={48} />
          <p className="text-sm">{workers.length === 0 ? "Рабочие ещё не добавлены" : "Ничего не найдено"}</p>
          {workers.length === 0 && (
            <button onClick={openCreate} className="btn-orange text-sm mt-1">Добавить первого рабочего</button>
          )}
        </div>
      ) : (
        <>
          {/* Группировка по объектам */}
          {(() => {
            const grouped: Record<string, Worker[]> = {};
            filtered.forEach(w => {
              const key = w.object_name || '—без объекта—';
              if (!grouped[key]) grouped[key] = [];
              grouped[key].push(w);
            });
            return Object.entries(grouped).map(([objName, ws]) => (
              <div key={objName} className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <Icon name={objName === '—без объекта—' ? "UserX" : "Building2"} size={14}
                    style={{ color: objName === '—без объекта—' ? "var(--text-muted)" : "var(--orange)" }} />
                  <h3 className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: objName === '—без объекта—' ? "var(--text-muted)" : "var(--orange)" }}>
                    {objName === '—без объекта—' ? 'Без объекта' : objName}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}>
                    {ws.length} чел.
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-3 animate-stagger">
                  {ws.map(w => (
                    <div key={w.id} className="app-card p-4 flex items-center gap-3 group">
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ background: "rgba(255,140,0,0.12)", color: "var(--orange)" }}>
                        {w.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm">{w.full_name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {w.specialty && (
                            <span className="text-xs px-2 py-0.5 rounded-lg"
                              style={{ background: "var(--surface-3)", color: "var(--text-secondary)" }}>
                              {w.specialty}
                            </span>
                          )}
                          {w.phone && (
                            <a href={`tel:${w.phone}`} className="flex items-center gap-1 text-xs"
                              style={{ color: "var(--text-muted)" }}>
                              <Icon name="Phone" size={11} />{w.phone}
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(w)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:text-orange-400"
                          style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}>
                          <Icon name="Pencil" size={14} />
                        </button>
                        <button onClick={() => remove(w.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:text-red-400"
                          style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}>
                          <Icon name="Trash2" size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()}

          {/* Специальности */}
          {workers.length >= 3 && (
            <div className="app-card p-4 mt-2">
              <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
                По специальностям
              </h3>
              <div className="flex flex-wrap gap-2">
                {specialties.filter(s => specialtyCounts[s] > 0).map(s => (
                  <div key={s} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs"
                    style={{ background: "var(--surface-3)", color: "var(--text-secondary)" }}>
                    <span>{s}</span>
                    <span className="font-bold" style={{ color: "var(--orange)" }}>{specialtyCounts[s]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-md animate-fade-in">
            <div className="app-card p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(255,140,0,0.15)" }}>
                  <Icon name="HardHat" size={20} style={{ color: "var(--orange)" }} />
                </div>
                <div>
                  <h2 className="font-oswald text-xl font-bold text-white tracking-wide">
                    {editing ? 'РЕДАКТИРОВАТЬ' : 'НОВЫЙ РАБОЧИЙ'}
                  </h2>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {editing ? 'Изменить данные' : 'Добавить в список'}
                  </p>
                </div>
                <button onClick={() => setShowForm(false)} className="ml-auto"
                  style={{ color: "var(--text-muted)" }}>
                  <Icon name="X" size={18} />
                </button>
              </div>

              <form onSubmit={save} className="flex flex-col gap-4">
                {/* ФИО */}
                <div>
                  <label className="text-xs uppercase tracking-widest mb-1.5 block" style={{ color: "var(--text-muted)" }}>
                    ФИО *
                  </label>
                  <div className="relative">
                    <Icon name="User" size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                    <input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                      required placeholder="Иванов Иван Иванович"
                      className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none"
                      style={{ background: "var(--surface-3)", border: "1px solid var(--surface-4)", color: "var(--text-primary)" }}
                      onFocus={e => (e.target.style.borderColor = "var(--orange)")}
                      onBlur={e => (e.target.style.borderColor = "var(--surface-4)")} />
                  </div>
                </div>

                {/* Специальность */}
                <div>
                  <label className="text-xs uppercase tracking-widest mb-1.5 block" style={{ color: "var(--text-muted)" }}>
                    Специальность
                  </label>
                  <select value={form.specialty} onChange={e => setForm(p => ({ ...p, specialty: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: "var(--surface-3)", border: "1px solid var(--surface-4)", color: form.specialty ? "var(--text-primary)" : "var(--text-muted)" }}>
                    <option value="">Выберите специальность</option>
                    {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Телефон */}
                <div>
                  <label className="text-xs uppercase tracking-widest mb-1.5 block" style={{ color: "var(--text-muted)" }}>
                    Телефон
                  </label>
                  <div className="relative">
                    <Icon name="Phone" size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                    <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+7 900 000-00-00" type="tel"
                      className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none"
                      style={{ background: "var(--surface-3)", border: "1px solid var(--surface-4)", color: "var(--text-primary)" }}
                      onFocus={e => (e.target.style.borderColor = "var(--orange)")}
                      onBlur={e => (e.target.style.borderColor = "var(--surface-4)")} />
                  </div>
                </div>

                {/* Назначение на объект */}
                <div>
                  <label className="text-xs uppercase tracking-widest mb-1.5 block" style={{ color: "var(--text-muted)" }}>
                    Назначить на объект
                  </label>
                  <div className="relative">
                    <Icon name="Building2" size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                    <select value={form.object_id || ''} onChange={e => setForm(p => ({ ...p, object_id: Number(e.target.value) || 0 }))}
                      className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none"
                      style={{ background: "var(--surface-3)", border: "1px solid var(--surface-4)", color: "var(--text-primary)" }}>
                      <option value="">— Без объекта —</option>
                      {objects.filter(o => o.status !== 'done').map(o => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                  </div>
                  {form.object_id ? (
                    <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: "var(--green)" }}>
                      <Icon name="CheckCircle2" size={12} />
                      Рабочий появится в табеле объекта
                    </p>
                  ) : (
                    <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
                      Можно назначить позже
                    </p>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
                    style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                    <Icon name="AlertCircle" size={14} />{error}
                  </div>
                )}

                <div className="flex gap-3 mt-1">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 py-3 rounded-xl text-sm font-medium"
                    style={{ background: "var(--surface-3)", color: "var(--text-secondary)", border: "1px solid var(--surface-4)" }}>
                    Отмена
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 btn-orange py-3 text-sm font-bold flex items-center justify-center gap-2">
                    {saving
                      ? <><Icon name="Loader2" size={15} className="animate-spin" />Сохранение...</>
                      : <><Icon name={editing ? "Check" : "UserPlus"} size={15} />{editing ? 'Сохранить' : 'Добавить'}</>
                    }
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
