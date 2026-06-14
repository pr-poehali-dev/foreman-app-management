import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import Objects from "./Objects";
import Timesheet from "./Timesheet";
import Workers from "./Workers";
import Documents from "./Documents";
import Photos from "./Photos";
import Team from "./Team";
import Stats from "./Stats";
import Settings from "./Settings";
import Chat from "@/components/Chat";
import RegisterForeman from "@/components/RegisterForeman";
import { logout } from "@/lib/api";
import type { User } from "@/lib/api";

const navItems = [
  { id: "stats",     label: "Статистика",   icon: "BarChart3",    badge: 0 },
  { id: "objects",   label: "Объекты",       icon: "Building2",    badge: 0 },
  { id: "workers",   label: "Рабочие",       icon: "HardHat",      badge: 0 },
  { id: "timesheet", label: "Табель",         icon: "CalendarDays", badge: 0 },
  { id: "documents", label: "Документы",      icon: "FolderOpen",   badge: 0 },
  { id: "photos",    label: "Фотоотчёты",     icon: "Camera",       badge: 0 },
  { id: "team",      label: "Команда",        icon: "Users",        badge: 0 },
  { id: "settings",  label: "Настройки",      icon: "Settings",     badge: 0 },
];

interface Props { user: User; onLogout: () => void }

export default function ManagerDashboard({ user, onLogout }: Props) {
  const [page, setPage] = useState("stats");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    const up = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    onLogout();
  }, [onLogout]);

  const pageComponents: Record<string, React.ReactNode> = {
    stats: <Stats user={user} />,
    objects: <Objects user={user} />,
    workers: <Workers user={user} />,
    timesheet: <Timesheet user={user} />,
    documents: <Documents user={user} />,
    photos: <Photos user={user} />,
    team: <Team user={user} onRegisterClick={() => setShowRegister(true)} />,
    settings: <Settings user={user} onLogout={handleLogout} />,
  };

  const currentNav = navItems.find(n => n.id === page);

  if (showChat) return <Chat user={user} onClose={() => setShowChat(false)} />;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--surface-1)" }}>
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 lg:hidden" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full z-40 w-64 flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "var(--surface-2)", borderRight: "1px solid var(--surface-4)" }}>

        <div className="px-5 py-5 flex items-center gap-3" style={{ borderBottom: "1px solid var(--surface-4)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "var(--orange)", boxShadow: "0 0 20px rgba(255,140,0,0.35)" }}>
            <Icon name="HardHat" size={18} style={{ color: "#000" }} />
          </div>
          <div>
            <div className="font-oswald text-white font-bold text-base leading-none tracking-wider">ПРОРАБ<span style={{ color: "var(--orange)" }}>ПРО</span></div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>ИП МАСАЛОВ</div>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <Icon name="X" size={18} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        {/* Role badge */}
        <div className="mx-3 mt-3 px-3 py-2 rounded-xl flex items-center gap-2"
          style={{ background: "rgba(255,140,0,0.08)", border: "1px solid rgba(255,140,0,0.2)" }}>
          <Icon name="Crown" size={14} style={{ color: "var(--orange)" }} />
          <span className="text-xs font-semibold" style={{ color: "var(--orange)" }}>Управленец</span>
          <div className="ml-auto w-2 h-2 rounded-full" style={{ background: isOnline ? "var(--green)" : "var(--text-muted)" }} />
        </div>

        <nav className="flex-1 px-3 py-3 overflow-y-auto flex flex-col gap-0.5">
          {navItems.map(item => {
            const active = page === item.id;
            return (
              <button key={item.id} onClick={() => { setPage(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${active ? "nav-active" : "hover:bg-white/5"}`}
                style={!active ? { color: "var(--text-secondary)" } : {}}>
                <Icon name={item.icon} fallback="Circle" size={18} style={{ color: active ? "var(--orange)" : "inherit" }} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}

          {/* Register foreman button — только для manager */}
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--surface-4)" }}>
            <button onClick={() => { setShowRegister(true); setSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all hover:bg-white/5"
              style={{ color: "var(--green)" }}>
              <Icon name="UserPlus" size={18} style={{ color: "var(--green)" }} />
              <span className="text-sm font-medium">Добавить прораба</span>
            </button>
          </div>
        </nav>

        {/* Chat button */}
        <div className="px-3 pb-3">
          <button onClick={() => setShowChat(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
            style={{ background: "rgba(59,130,246,0.1)", color: "var(--blue)", border: "1px solid rgba(59,130,246,0.2)" }}>
            <Icon name="MessageSquare" size={18} />
            <span className="text-sm font-medium">Общий чат</span>
          </button>
        </div>

        {/* User */}
        <div className="px-4 py-4" style={{ borderTop: "1px solid var(--surface-4)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold"
              style={{ background: "rgba(255,140,0,0.15)", color: "var(--orange)" }}>
              {user.full_name.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.full_name}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>@{user.login}</p>
            </div>
            <button onClick={handleLogout} title="Выйти"
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:text-red-400"
              style={{ color: "var(--text-muted)" }}>
              <Icon name="LogOut" size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--surface-4)" }}>
          <button className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "var(--surface-3)" }} onClick={() => setSidebarOpen(true)}>
            <Icon name="Menu" size={18} style={{ color: "var(--text-secondary)" }} />
          </button>
          <div className="flex items-center gap-2">
            <Icon name={currentNav?.icon ?? "Circle"} fallback="Circle" size={18} style={{ color: "var(--orange)" }} />
            <h2 className="font-oswald font-semibold text-white tracking-wide">{currentNav?.label}</h2>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {!isOnline && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                style={{ background: "rgba(255,140,0,0.1)", color: "var(--orange)", border: "1px solid rgba(255,140,0,0.2)" }}>
                <Icon name="CloudOff" size={13} />Офлайн
              </div>
            )}
            <button onClick={() => setShowChat(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "var(--surface-3)", color: "var(--blue)" }}>
              <Icon name="MessageSquare" size={17} />
            </button>
          </div>
        </header>

        {!isOnline && (
          <div className="offline-banner px-4 py-2 flex items-center gap-2 text-xs flex-shrink-0">
            <Icon name="WifiOff" size={13} style={{ color: "var(--orange)" }} />
            <span style={{ color: "var(--orange)" }}>Офлайн — изменения сохранятся при подключении</span>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div key={page}>{pageComponents[page]}</div>
        </main>

        {/* Bottom nav mobile */}
        <nav className="lg:hidden tab-bar flex-shrink-0 flex items-center justify-around px-1 py-2">
          {navItems.slice(0, 5).map(item => {
            const active = page === item.id;
            return (
              <button key={item.id} onClick={() => setPage(item.id)}
                className="flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-all"
                style={{ color: active ? "var(--orange)" : "var(--text-muted)" }}>
                <Icon name={item.icon} fallback="Circle" size={20} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {showRegister && <RegisterForeman onClose={() => setShowRegister(false)} />}
    </div>
  );
}