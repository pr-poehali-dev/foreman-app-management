import { useState } from "react";
import Icon from "@/components/ui/icon";

const sections = [
  {
    title: "Профиль",
    items: [
      { icon: "User", label: "Имя", value: "Александр Крылов", type: "text" },
      { icon: "Phone", label: "Телефон", value: "+7 900 123-45-67", type: "text" },
      { icon: "Mail", label: "Email", value: "krylov@stroy.ru", type: "text" },
      { icon: "HardHat", label: "Должность", value: "Управляющий прораб", type: "text" },
    ]
  },
  {
    title: "Уведомления",
    items: [
      { icon: "Bell", label: "Новые задачи", value: true, type: "toggle" },
      { icon: "Clock", label: "Напоминания о сроках", value: true, type: "toggle" },
      { icon: "UserCheck", label: "Отметки прорабов", value: false, type: "toggle" },
      { icon: "FileText", label: "Новые документы", value: true, type: "toggle" },
    ]
  },
  {
    title: "Синхронизация",
    items: [
      { icon: "Wifi", label: "Автосинхронизация", value: true, type: "toggle" },
      { icon: "Database", label: "Офлайн-кэш", value: "128 МБ", type: "info" },
      { icon: "RefreshCw", label: "Последняя синхронизация", value: "14.06.2026, 09:42", type: "info" },
      { icon: "CloudOff", label: "Хранить офлайн (дней)", value: "7", type: "text" },
    ]
  },
];

export default function Settings() {
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    "Новые задачи": true,
    "Напоминания о сроках": true,
    "Отметки прорабов": false,
    "Новые документы": true,
    "Автосинхронизация": true,
  });

  function toggle(label: string) {
    setToggles(prev => ({ ...prev, [label]: !prev[label] }));
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-oswald font-bold text-white tracking-wide">НАСТРОЙКИ</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>Управление профилем и приложением</p>
      </div>

      {/* Avatar block */}
      <div className="app-card p-5 flex items-center gap-5 mb-5">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold"
          style={{ background: "rgba(255,140,0,0.15)", color: "var(--orange)" }}>
          АК
        </div>
        <div>
          <p className="text-white font-semibold text-lg">Александр Крылов</p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Управляющий прораб</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: "var(--green)" }} />
            <span className="text-xs" style={{ color: "var(--green)" }}>Онлайн</span>
          </div>
        </div>
        <button className="ml-auto btn-orange text-sm px-4 py-2">Изменить фото</button>
      </div>

      <div className="flex flex-col gap-4">
        {sections.map(sec => (
          <div key={sec.title} className="app-card overflow-hidden">
            <div className="px-5 py-3 border-b" style={{ borderColor: "var(--surface-4)" }}>
              <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                {sec.title}
              </h2>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--surface-4)" }}>
              {sec.items.map(item => (
                <div key={item.label} className="px-5 py-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--surface-3)" }}>
                    <Icon name={item.icon} fallback="Settings" size={15} style={{ color: "var(--orange)" }} />
                  </div>
                  <span className="flex-1 text-sm text-white">{item.label}</span>

                  {item.type === "toggle" && (
                    <button
                      onClick={() => toggle(item.label)}
                      className="relative w-11 h-6 rounded-full transition-all"
                      style={{ background: toggles[item.label] ? "var(--orange)" : "var(--surface-4)" }}>
                      <span className="absolute top-1 transition-all w-4 h-4 rounded-full bg-white"
                        style={{ left: toggles[item.label] ? "calc(100% - 20px)" : "4px" }} />
                    </button>
                  )}

                  {item.type === "text" && (
                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{item.value as string}</span>
                  )}

                  {item.type === "info" && (
                    <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>{item.value as string}</span>
                  )}

                  {item.type !== "toggle" && (
                    <Icon name="ChevronRight" size={16} style={{ color: "var(--text-muted)" }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sync now */}
      <div className="mt-4 app-card p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(34,197,94,0.12)" }}>
          <Icon name="RefreshCw" size={18} style={{ color: "var(--green)" }} />
        </div>
        <div>
          <p className="text-white text-sm font-medium">Синхронизировать сейчас</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Загрузить все изменения на сервер</p>
        </div>
        <button className="ml-auto px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{ background: "rgba(34,197,94,0.12)", color: "var(--green)", border: "1px solid rgba(34,197,94,0.2)" }}>
          Синхронизировать
        </button>
      </div>

      <div className="mt-4 text-center">
        <button className="text-sm" style={{ color: "var(--red)" }}>Выйти из аккаунта</button>
      </div>
    </div>
  );
}
