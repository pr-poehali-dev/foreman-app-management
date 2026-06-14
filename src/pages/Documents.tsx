import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { getDocuments, deleteDocument, uploadFile } from "@/lib/api";
import type { Doc, User } from "@/lib/api";

interface Props { user: User }

const categories = ["Все", "Акты", "Сметы", "Проект", "Журналы", "Договоры", "Сертификаты", "Прочее"];

const fileIcons: Record<string, { icon: string; color: string; bg: string }> = {
  pdf:  { icon: "FileText",        color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  xlsx: { icon: "FileSpreadsheet", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  xls:  { icon: "FileSpreadsheet", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  docx: { icon: "FileType",        color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  doc:  { icon: "FileType",        color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  png:  { icon: "Image",           color: "#a855f7", bg: "rgba(168,85,247,0.12)" },
  jpg:  { icon: "Image",           color: "#a855f7", bg: "rgba(168,85,247,0.12)" },
  jpeg: { icon: "Image",           color: "#a855f7", bg: "rgba(168,85,247,0.12)" },
};

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Documents({ user }: Props) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("Все");
  const [search, setSearch] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [selectedCategory, setSelectedCategory] = useState("Акты");
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    try { setDocs(await getDocuments()); } catch { /* offline */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true); setError('');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`Загрузка ${i + 1}/${files.length}: ${file.name}`);
      try {
        const base64 = await readFileAsBase64(file);
        const ext = file.name.split('.').pop()?.toLowerCase() || 'file';
        const result = await uploadFile({
          file_data: base64,
          file_name: file.name,
          file_type: file.type || 'application/octet-stream',
          upload_type: 'document',
          category: selectedCategory,
        });
        setDocs(prev => [{ ...result, file_type: ext } as Doc, ...prev]);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      }
    }

    setUploading(false);
    setUploadProgress('');
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
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-oswald font-bold text-white tracking-wide">ДОКУМЕНТЫ</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{docs.length} файлов</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="btn-orange flex items-center gap-2 text-sm min-h-[44px] px-4">
          {uploading
            ? <><Icon name="Loader2" size={16} className="animate-spin" />Загрузка...</>
            : <><Icon name="Upload" size={16} />Загрузить файл</>
          }
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
        onChange={e => handleFiles(e.target.files)}
      />

      {/* Category selector for upload — horizontal scroll on mobile */}
      <div className="app-card p-4 mb-4">
        <span className="text-xs font-medium block mb-2.5" style={{ color: "var(--text-muted)" }}>Категория загрузки:</span>
        <div className="flex gap-2 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {categories.filter(c => c !== "Все").map(c => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className="px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 min-h-[36px]"
              style={{
                background: selectedCategory === c ? "var(--orange)" : "var(--surface-3)",
                color: selectedCategory === c ? "#000" : "var(--text-secondary)",
                border: `1px solid ${selectedCategory === c ? "var(--orange)" : "var(--surface-4)"}`,
              }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center py-8 sm:py-10 mb-5 transition-all cursor-pointer"
        style={{
          borderColor: dragOver ? "var(--orange)" : uploading ? "var(--green)" : "var(--surface-4)",
          background: dragOver ? "rgba(255,140,0,0.06)" : uploading ? "rgba(34,197,94,0.05)" : "var(--surface-2)",
        }}>
        {uploading ? (
          <>
            <Icon name="Loader2" size={28} className="animate-spin mb-3" style={{ color: "var(--green)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--green)" }}>{uploadProgress}</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Файл загружается в облако...</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: dragOver ? "rgba(255,140,0,0.15)" : "var(--surface-3)" }}>
              <Icon name="Upload" size={22} style={{ color: dragOver ? "var(--orange)" : "var(--text-muted)" }} />
            </div>
            <p className="text-sm font-medium" style={{ color: dragOver ? "var(--orange)" : "var(--text-secondary)" }}>
              {dragOver ? "Отпустите файл" : "Перетащите файл или нажмите"}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>PDF, DOCX, XLSX, PNG, JPG — до 50 МБ</p>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 text-sm"
          style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
          <Icon name="AlertCircle" size={15} />{error}
          <button onClick={() => setError('')} className="ml-auto w-8 h-8 flex items-center justify-center">
            <Icon name="X" size={14} />
          </button>
        </div>
      )}

      {/* Filters + search */}
      <div className="flex flex-col gap-2 mb-4">
        {/* Category filter — horizontal scroll, no wrap */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all min-h-[44px] ${cat === c ? "btn-orange" : ""}`}
              style={cat !== c ? { background: "var(--surface-3)", color: "var(--text-secondary)", border: "1px solid var(--surface-4)" } : {}}>
              {c}
              {c !== "Все" && docs.filter(d => d.category === c).length > 0 && (
                <span className="ml-1.5 text-xs opacity-60">({docs.filter(d => d.category === c).length})</span>
              )}
            </button>
          ))}
        </div>
        {/* Search — full width on mobile */}
        <div className="relative w-full sm:max-w-[240px]">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск..."
            className="w-full pl-9 pr-3 py-3 rounded-xl text-base outline-none"
            style={{ background: "var(--surface-3)", border: "1px solid var(--surface-4)", color: "var(--text-primary)" }}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">{[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: "var(--text-muted)" }}>
          <Icon name="FolderOpen" size={40} />
          <p className="text-sm">{docs.length === 0 ? "Загрузите первый документ" : "Ничего не найдено"}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 animate-stagger">
          {filtered.map(doc => {
            const ext = doc.file_type?.toLowerCase() || 'file';
            const fi = fileIcons[ext] || { icon: "File", color: "var(--text-secondary)", bg: "var(--surface-3)" };
            return (
              <div key={doc.id} className="app-card p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: fi.bg }}>
                  <Icon name={fi.icon} fallback="File" size={20} style={{ color: fi.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm truncate">{doc.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs flex-wrap" style={{ color: "var(--text-muted)" }}>
                    {doc.object_name && <span className="truncate max-w-[90px]">{doc.object_name}</span>}
                    {doc.file_size && <><span>·</span><span>{doc.file_size}</span></>}
                    {doc.created_at && <><span>·</span><span>{new Date(doc.created_at).toLocaleDateString('ru')}</span></>}
                  </div>
                </div>
                {doc.category && (
                  <span className="status-badge text-xs flex-shrink-0 hidden sm:inline-flex"
                    style={{ background: "var(--surface-3)", color: "var(--text-secondary)" }}>
                    {doc.category}
                  </span>
                )}
                {/* Actions — always visible on mobile */}
                <div className="flex gap-1 flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  {doc.file_url && (
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="w-10 h-10 rounded-lg flex items-center justify-center hover:text-orange-400 transition-colors"
                      style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}>
                      <Icon name="Download" size={15} />
                    </a>
                  )}
                  {user.role === 'manager' && (
                    <button
                      onClick={() => remove(doc.id)}
                      className="w-10 h-10 rounded-lg flex items-center justify-center hover:text-red-400 transition-colors"
                      style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}>
                      <Icon name="Trash2" size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
