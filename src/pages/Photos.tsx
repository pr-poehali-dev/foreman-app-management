import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { getPhotos, uploadFile } from "@/lib/api";
import type { Photo, User } from "@/lib/api";

interface Props { user: User }

const stages = ["Все", "Фундамент", "Каркас", "Кровля", "Фасад", "Инженерия", "Отделка", "Прочее"];

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Photos({ user }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Все");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<Photo | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [selectedStage, setSelectedStage] = useState("Прочее");
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    try { setPhotos(await getPhotos()); } catch { /* offline */ }
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
        const result = await uploadFile({
          file_data: base64,
          file_name: file.name,
          file_type: file.type || 'image/jpeg',
          upload_type: 'photo',
          caption: file.name.replace(/\.[^.]+$/, ''),
          stage: selectedStage,
        });
        setPhotos(prev => [result as Photo, ...prev]);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      }
    }

    setUploading(false);
    setUploadProgress('');
  }

  const filtered = photos.filter(p => filter === "Все" || p.stage === filter);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-oswald font-bold text-white tracking-wide">ФОТООТЧЁТЫ</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{photos.length} фото</p>
        </div>
        {/* Header action buttons */}
        <div className="flex gap-1.5">
          <button
            onClick={() => setView(view === "grid" ? "list" : "grid")}
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: "var(--surface-3)", color: "var(--text-secondary)", border: "1px solid var(--surface-4)" }}>
            <Icon name={view === "grid" ? "LayoutList" : "Grid3X3"} size={17} />
          </button>
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading}
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: "var(--surface-3)", color: "var(--text-secondary)", border: "1px solid var(--surface-4)" }}
            title="Сфотографировать">
            <Icon name="Camera" size={17} />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn-orange flex items-center gap-2 text-sm min-h-[44px] px-3 sm:px-4">
            {uploading
              ? <><Icon name="Loader2" size={16} className="animate-spin" /><span className="hidden sm:inline">Загрузка...</span></>
              : <><Icon name="ImagePlus" size={16} /><span className="hidden sm:inline">Добавить фото</span></>
            }
          </button>
        </div>
      </div>

      {/* Скрытые инпуты */}
      <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden"
        onChange={e => handleFiles(e.target.files)} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e => handleFiles(e.target.files)} />

      {/* Stage selector — horizontal scroll on mobile */}
      <div className="app-card p-4 mb-4">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-xs font-medium flex-shrink-0" style={{ color: "var(--text-muted)" }}>Этап фото:</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {stages.filter(s => s !== "Все").map(s => (
            <button
              key={s}
              onClick={() => setSelectedStage(s)}
              className="px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 min-h-[36px]"
              style={{
                background: selectedStage === s ? "var(--orange)" : "var(--surface-3)",
                color: selectedStage === s ? "#000" : "var(--text-secondary)",
                border: `1px solid ${selectedStage === s ? "var(--orange)" : "var(--surface-4)"}`,
              }}>
              {s}
            </button>
          ))}
        </div>
        {uploading && (
          <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: "var(--green)" }}>
            <Icon name="Loader2" size={15} className="animate-spin" />
            {uploadProgress}
          </div>
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

      {/* Filter by stage — horizontal scroll, no wrap */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {stages.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all min-h-[44px] ${filter === s ? "btn-orange" : ""}`}
            style={filter !== s ? { background: "var(--surface-3)", color: "var(--text-secondary)", border: "1px solid var(--surface-4)" } : {}}>
            {s}
            {s !== "Все" && photos.filter(p => p.stage === s).length > 0 && (
              <span className="ml-1 text-xs opacity-60">({photos.filter(p => p.stage === s).length})</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton aspect-square rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4" style={{ color: "var(--text-muted)" }}>
          <Icon name="Camera" size={44} />
          <p className="text-sm">{photos.length === 0 ? "Добавьте первый фотоотчёт" : "Фото для этого этапа нет"}</p>
          <div className="flex gap-3">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium min-h-[44px]"
              style={{ background: "var(--surface-3)", color: "var(--text-secondary)", border: "1px solid var(--surface-4)" }}>
              <Icon name="Camera" size={15} />Камера
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="btn-orange text-sm min-h-[44px] px-4">
              <span className="flex items-center gap-2"><Icon name="ImagePlus" size={15} />Из галереи</span>
            </button>
          </div>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 animate-stagger">
          {filtered.map(p => (
            <div
              key={p.id}
              onClick={() => setSelected(p)}
              className="rounded-2xl overflow-hidden cursor-pointer group relative aspect-square"
              style={{ border: "1px solid var(--surface-4)", background: "var(--surface-3)" }}>
              <img
                src={p.photo_url}
                alt={p.caption}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              {/* Caption overlay — always visible on mobile via active, hover on desktop */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-2 sm:p-3 opacity-0 group-hover:opacity-100 sm:opacity-0 active:opacity-100 transition-opacity">
                <p className="text-white text-xs font-medium line-clamp-2">{p.caption}</p>
              </div>
              {p.stage && (
                <div className="absolute top-2 left-2">
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: "rgba(255,140,0,0.9)", color: "#000" }}>
                    {p.stage}
                  </span>
                </div>
              )}
            </div>
          ))}

          {/* Upload tile */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="rounded-2xl flex flex-col items-center justify-center aspect-square cursor-pointer border-2 border-dashed transition-all hover:border-orange-400 gap-2"
            style={{ borderColor: "var(--surface-4)", background: "var(--surface-2)" }}>
            <Icon name="Plus" size={28} style={{ color: "var(--text-muted)" }} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Загрузить</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 animate-stagger">
          {filtered.map(p => (
            <div key={p.id} onClick={() => setSelected(p)} className="app-card p-3 flex items-center gap-3 sm:gap-4 cursor-pointer">
              <img src={p.photo_url} alt={p.caption}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover flex-shrink-0" loading="lazy" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm truncate">{p.caption}</p>
                {p.object_name && <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{p.object_name}</p>}
                {p.uploader && <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{p.uploader}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                {p.stage && (
                  <span className="status-badge text-xs" style={{ background: "rgba(255,140,0,0.12)", color: "var(--orange)" }}>
                    {p.stage}
                  </span>
                )}
                {p.created_at && (
                  <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
                    {new Date(p.created_at).toLocaleDateString('ru')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
          style={{ background: "rgba(0,0,0,0.95)", backdropFilter: "blur(10px)" }}
          onClick={() => setSelected(null)}>
          <div className="max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <img
              src={selected.photo_url}
              alt={selected.caption}
              className="w-full rounded-2xl object-contain"
              style={{ maxHeight: "60vh" }}
            />
            <div className="mt-3 sm:mt-4 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm sm:text-base truncate">{selected.caption}</p>
                <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs sm:text-sm flex-wrap" style={{ color: "var(--text-secondary)" }}>
                  {selected.stage && <span style={{ color: "var(--orange)" }}>{selected.stage}</span>}
                  {selected.object_name && <span className="truncate max-w-[120px]">{selected.object_name}</span>}
                  {selected.created_at && <span>{new Date(selected.created_at).toLocaleDateString('ru')}</span>}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <a
                  href={selected.photo_url}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--surface-3)", color: "var(--text-secondary)" }}>
                  <Icon name="Download" size={17} />
                </a>
                <button
                  onClick={() => setSelected(null)}
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--surface-3)", color: "var(--text-secondary)" }}>
                  <Icon name="X" size={17} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
