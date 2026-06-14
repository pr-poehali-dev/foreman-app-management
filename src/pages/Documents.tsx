import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { getDocuments, addDocument, deleteDocument } from "@/lib/api";
import type { Doc, User } from "@/lib/api";

interface Props { user: User }

const categories = ["Все", "Акты", "Сметы", "Проект", "Журналы", "Договоры", "Сертификаты", "Прочее"];
const fileIcons: Record<string, { icon: string; color: string; bg: string }> = {
  pdf:  { icon: "FileText",        color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  xlsx: { icon: "FileSpreadsheet", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  xls:  { icon: "FileSpreadsheet", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  docx: { icon: "FileType",        color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  doc:  { icon: "FileType",        color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
};

export default function Documents({ user }: Props) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("Все");
  const [search, setSearch] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', file_url: '', file_size: '', file_type: 'pdf', category: 'Акты' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try { const data = await getDocuments(); setDocs(data); } catch { /* offline */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const created = await addDocument(form);
      setDocs(prev => [created, ...prev]);
      setShowForm(false);
      setForm({ name: '', file_url: '', file_size: '', file_type: 'pdf', category: 'Акты' });
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
    setSaving(false);
  }

  async function remove(id: number) {
    if (!confirm('Удалить документ?')) return;
    try { await deleteDocument(id); setDocs(prev => prev.filter(d => d.id !== id)); }
    catch (err: unknown) { alert(err instanceof Error ? err.message : 'Ошибка'); }
  }

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
        <button onClick={() => setShowForm(true)} className="btn-orange flex items-center gap-2 text-sm">
          <Icon name="Upload" size={16} />Добавить
        </button>
      </div>

      {/* Drop zone */}
      <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
        onDrop={() => { setDragOver(false); setShowForm(true); }}
        onClick={() => setShowForm(true)}
        className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center py-7 mb-5 transition-all cursor-pointer"
        style={{ borderColor: dragOver ? "var(--orange)" : "var(--surface-4)", background: dragOver ? "rgba(255,140,0,0.06)" : "var(--surface-2)" }}>
        <Icon name="Upload" size={22} style={{ color: dragOver ? "var(--orange)" : "var(--text-muted)" }} />
        <p className="text-sm font-medium mt-2" style={{ color: dragOver ? "var(--orange)" : "var(--text-secondary)" }}>
          Нажмите или перетащите файл
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>PDF, DOCX, XLSX — до 50 МБ</p>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 flex-wrap">
        {categories.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${cat === c ? "btn-orange" : ""}`}
            style={cat !== c ? { background: "var(--surface-3)", color: "var(--text-secondary)", border: "1px solid var(--surface-4)" } : {}}>
            {c}
          </button>
        ))}
        <div className="relative ml-auto min-w-[160px]">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск..."
            className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: "var(--surface-3)", border: "1px solid var(--surface-4)", color: "var(--text-primary)" }} />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">{[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: "var(--text-muted)" }}>
          <Icon name="FolderOpen" size={40} />
          <p className="text-sm">Документов пока нет</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 animate-stagger">
          {filtered.map(doc => {
            const fi = fileIcons[doc.file_type] || fileIcons.pdf;
            return (
              <div key={doc.id} className="app-card p-4 flex items-center gap-4 group">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: fi.bg }}>
                  <Icon name={fi.icon} fallback="File" size={20} style={{ color: fi.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm truncate">{doc.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    {doc.object_name && <><span className="truncate max-w-[120px]">{doc.object_name}</span><span>·</span></>}
                    {doc.file_size && <span>{doc.file_size}</span>}
                    {doc.created_at && <><span>·</span><span>{new Date(doc.created_at).toLocaleDateString('ru')}</span></>}
                  </div>
                </div>
                {doc.category && (
                  <span className="status-badge text-xs flex-shrink-0" style={{ background: "var(--surface-3)", color: "var(--text-secondary)" }}>
                    {doc.category}
                  </span>
                )}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noreferrer"
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:text-orange-400 transition-colors"
                      style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}>
                      <Icon name="Download" size={14} />
                    </a>
                  )}
                  {user.role === 'manager' && (
                    <button onClick={() => remove(doc.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:text-red-400 transition-colors"
                      style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}>
                      <Icon name="Trash2" size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-md animate-fade-in">
            <div className="app-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-oswald text-xl font-bold text-white">ДОБАВИТЬ ДОКУМЕНТ</h2>
                <button onClick={() => setShowForm(false)} style={{ color: "var(--text-muted)" }}><Icon name="X" size={18} /></button>
              </div>
              <form onSubmit={save} className="flex flex-col gap-3">
                <div>
                  <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: "var(--text-muted)" }}>Название *</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required
                    placeholder="Акт выполненных работ №1"
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--surface-3)", border: "1px solid var(--surface-4)", color: "var(--text-primary)" }} />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: "var(--text-muted)" }}>Ссылка на файл</label>
                  <input value={form.file_url} onChange={e => setForm(p => ({ ...p, file_url: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--surface-3)", border: "1px solid var(--surface-4)", color: "var(--text-primary)" }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: "var(--text-muted)" }}>Тип файла</label>
                    <select value={form.file_type} onChange={e => setForm(p => ({ ...p, file_type: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: "var(--surface-3)", border: "1px solid var(--surface-4)", color: "var(--text-primary)" }}>
                      {['pdf','docx','xlsx','doc','xls'].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: "var(--text-muted)" }}>Категория</label>
                    <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: "var(--surface-3)", border: "1px solid var(--surface-4)", color: "var(--text-primary)" }}>
                      {categories.filter(c => c !== "Все").map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest mb-1 block" style={{ color: "var(--text-muted)" }}>Размер файла</label>
                  <input value={form.file_size} onChange={e => setForm(p => ({ ...p, file_size: e.target.value }))}
                    placeholder="1.2 МБ"
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--surface-3)", border: "1px solid var(--surface-4)", color: "var(--text-primary)" }} />
                </div>
                {error && <div className="px-3 py-2 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>{error}</div>}
                <div className="flex gap-3 mt-1">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm"
                    style={{ background: "var(--surface-3)", color: "var(--text-secondary)", border: "1px solid var(--surface-4)" }}>
                    Отмена
                  </button>
                  <button type="submit" disabled={saving} className="flex-1 btn-orange py-2.5 text-sm font-bold flex items-center justify-center gap-2">
                    {saving ? <><Icon name="Loader2" size={14} className="animate-spin" />Сохранение...</> : <><Icon name="Upload" size={14} />Добавить</>}
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
