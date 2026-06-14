import { useState } from "react";
import Icon from "@/components/ui/icon";
import type { User } from "@/lib/api";

interface Props { user: User; onLogout: () => void }

export default function Settings({ user, onLogout }: Props) {
  const [notifs, setNotifs] = useState({
    tasks: true, deadlines: true, checkins: false, docs: true, autoSync: true,
  });

  function toggle(k: keyof typeof notifs) {
    setNotifs(p => ({ ...p, [k]: !p[k] }));
  }

  const initials = user.full_name.split(' ').map(w => w[0]).join('').slice(0, 2);
  const avatarColor = user.role === 'manager' ? 'var(--orange)' : 'var(--blue)';
  const avatarBg = user.role === 'manager' ? 'rgba(255,140,0,0.15)' : 'rgba(59,130,246,0.15)';

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-oswald font-bold text-white tracking-wide">НАСТРОЙКИ</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>Профиль и параметры приложения</p>
      </div>

      {/* Profile card */}
      <div className="app-card p-5 flex items-center gap-5 mb-5">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold"
          style={{ background: avatarBg, color: avatarColor }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-lg truncate">{user.full_name}</p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>@{user.login}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="status-badge text-xs"
              style={{ background: user.role === 'manager' ? 'rgba(255,140,0,0.12)' : 'rgba(59,130,246,0.12)', color: user.role === 'manager' ? 'var(--orange)' : 'var(--blue)' }}>
              {user.role === 'manager' ? 'Управленец' : 'Прораб'}
            </span>
            {user.phone && (
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{user.phone}</span>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="app-card overflow-hidden mb-4">
        <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--surface-4)" }}>
          <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Уведомления</h2>
        </div>
        <div className="divide-y" style={{ borderColor: "var(--surface-4)" }}>
          {[
            { k: 'tasks' as const,    icon: "Bell",      label: "Новые задачи" },
            { k: 'deadlines' as const,icon: "Clock",     label: "Напоминания о сроках" },
            { k: 'checkins' as const, icon: "UserCheck", label: "Отметки прорабов" },
            { k: 'docs' as const,     icon: "FileText",  label: "Новые документы" },
          ].map(item => (
            <div key={item.k} className="px-5 py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--surface-3)" }}>
                <Icon name={item.icon} fallback="Settings" size={15} style={{ color: "var(--orange)" }} />
              </div>
              <span className="flex-1 text-sm text-white">{item.label}</span>
              <button onClick={() => toggle(item.k)}
                className="relative w-11 h-6 rounded-full transition-all"
                style={{ background: notifs[item.k] ? "var(--orange)" : "var(--surface-4)" }}>
                <span className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                  style={{ left: notifs[item.k] ? 'calc(100% - 20px)' : '4px' }} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Sync */}
      <div className="app-card overflow-hidden mb-4">
        <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--surface-4)" }}>
          <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Синхронизация</h2>
        </div>
        <div className="divide-y" style={{ borderColor: "var(--surface-4)" }}>
          <div className="px-5 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--surface-3)" }}>
              <Icon name="Wifi" size={15} style={{ color: "var(--orange)" }} />
            </div>
            <span className="flex-1 text-sm text-white">Автосинхронизация</span>
            <button onClick={() => toggle('autoSync')}
              className="relative w-11 h-6 rounded-full transition-all"
              style={{ background: notifs.autoSync ? "var(--orange)" : "var(--surface-4)" }}>
              <span className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                style={{ left: notifs.autoSync ? 'calc(100% - 20px)' : '4px' }} />
            </button>
          </div>
          {[
            { icon: "Database", label: "Офлайн-кэш", val: "Включён" },
            { icon: "RefreshCw", label: "Последняя синхронизация", val: new Date().toLocaleString('ru') },
          ].map(item => (
            <div key={item.label} className="px-5 py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--surface-3)" }}>
                <Icon name={item.icon} fallback="Circle" size={15} style={{ color: "var(--orange)" }} />
              </div>
              <span className="flex-1 text-sm text-white">{item.label}</span>
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>{item.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* About */}
      <div className="app-card p-4 flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "var(--orange)", boxShadow: "0 0 15px rgba(255,140,0,0.3)" }}>
          <Icon name="HardHat" size={18} style={{ color: "#000" }} />
        </div>
        <div>
          <p className="text-white text-sm font-semibold">ПрорабПРО · ИП МАСАЛОВ</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Версия 1.0 · Управление строительством</p>
        </div>
      </div>

      <div className="text-center pt-2">
        <button onClick={onLogout}
          className="px-6 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
          <span className="flex items-center gap-2">
            <Icon name="LogOut" size={15} />
            Выйти из аккаунта
          </span>
        </button>
      </div>
    </div>
  );
}
