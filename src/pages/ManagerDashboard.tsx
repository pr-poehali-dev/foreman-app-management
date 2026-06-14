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
  { id: "stats",     label: "Статистика",   icon: "BarChart3"    },
  { id: "objects",   label: "Объекты",       icon: "Building2"    },
  { id: "workers",   label: "Рабочие",       icon: "HardHat"      },
  { id: "timesheet", label: "Табель",         icon: "CalendarDays" },
  { id: "documents", label: "Документы",      icon: "FolderOpen"   },
  { id: "photos",    label: "Фото",           icon: "Camera"       },
  { id: "team",      label: "Команда",        icon: "Users"        },
  { id: "settings",  label: "Настройки",      icon: "Settings"     },
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

  const navigate = (id: string) => { setPage(id); setSidebarOpen(false); };

  const pageComponents: Record<string, React.ReactNode> = {
    stats:     <Stats user={user} />,
    objects:   <Objects user={user} />,
    workers:   <Workers user={user} />,
    timesheet: <Timesheet user={user} />,
    documents: <Documents user={user} />,
    photos:    <Photos user={user} />,
    team:      <Team user={user} onRegisterClick={() => setShowRegister(true)} />,
    settings:  <Settings user={user} onLogout={handleLogout} />,
  };

  const currentNav = navItems.find(n => n.id === page);
  if (showChat) return <Chat user={user} onClose={() => setShowChat(false)} />;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--surface-1)" }}>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 lg:hidden"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside className={`fixed top-0 left-0 h-full z-40 flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ width: 240, background: "var(--surface-2)", borderRight: "1px solid var(--surface-4)" }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: "1px solid var(--surface-4)" }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--orange)", boxShadow: "0 0 16px rgba(255,140,0,0.35)" }}>
            <Icon name="HardHat" size={16} style={{ color: "#000" }} />
          </div>
          <div className="min-w-0">
            <div className="font-oswald text-white font-bold text-sm leading-none tracking-wider truncate">
              ПРОРАБ<span style={{ color: "var(--orange)" }}>ПРО</span>
            </div>
            <div className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>ИП МАСАЛОВ</div>
          </div>
          <button className="ml-auto lg:hidden tap-target" onClick={() => setSidebarOpen(false)}>
            <Icon name="X" size={18} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        {/* Role */}
        <div className="mx-3 mt-3 px-3 py-2 rounded-xl flex items-center gap-2"
          style={{ background: "rgba(255,140,0,0.08)", border: "1px solid rgba(255,140,0,0.2)" }}>
          <Icon name="Crown" size={13} style={{ color: "var(--orange)" }} />
          <span className="text-xs font-semibold" style={{ color: "var(--orange)" }}>Управленец</span>
          <div className="ml-auto w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: isOnline ? "var(--green)" : "var(--text-muted)" }} />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-2 overflow-y-auto flex flex-col gap-0.5">
          {navItems.map(item => {
            const active = page === item.id;
            return (
              <button key={item.id} onClick={() => navigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${active ? "nav-active" : "hover:bg-white/5"}`}
                style={!active ? { color: "var(--text-secondary)" } : {}}>
                <Icon name={item.icon} fallback="Circle" size={17} style={{ color: active ? "var(--orange)" : "inherit" }} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
          <div className="mt-2 pt-2" style={{ borderTop: "1px solid var(--surface-4)" }}>
            <button onClick={() => { setShowRegister(true); setSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-white/5 transition-all"
              style={{ color: "var(--green)" }}>
              <Icon name="UserPlus" size={17} style={{ color: "var(--green)" }} />
              <span className="text-sm font-medium">Добавить прораба</span>
            </button>
          </div>
        </nav>

        {/* Chat */}
        <div className="px-2 pb-2">
          <button onClick={() => setShowChat(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
            style={{ background: "rgba(59,130,246,0.1)", color: "var(--blue)", border: "1px solid rgba(59,130,246,0.2)" }}>
            <Icon name="MessageSquare" size={17} />
            <span className="text-sm font-medium">Общий чат</span>
          </button>
        </div>

        {/* User */}
        <div className="px-3 py-3" style={{ borderTop: "1px solid var(--surface-4)" }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: "rgba(255,140,0,0.15)", color: "var(--orange)" }}>
              {user.full_name.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.full_name}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)", fontSize: 10 }}>@{user.login}</p>
            </div>
            <button onClick={handleLogout} title="Выйти"
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:text-red-400 flex-shrink-0"
              style={{ color: "var(--text-muted)" }}>
              <Icon name="LogOut" size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="flex items-center gap-2 px-3 py-2.5 flex-shrink-0"
          style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--surface-4)" }}>
          <button className="lg:hidden icon-btn flex-shrink-0" onClick={() => setSidebarOpen(true)}>
            <Icon name="Menu" size={18} style={{ color: "var(--text-secondary)" }} />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <Icon name={currentNav?.icon ?? "Circle"} fallback="Circle" size={16} style={{ color: "var(--orange)" }} />
            <h2 className="font-oswald font-semibold text-white tracking-wide text-sm sm:text-base truncate">
              {currentNav?.label}
            </h2>
          </div>
          <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
            {!isOnline && (
              <span className="hidden sm:flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                style={{ background: "rgba(255,140,0,0.1)", color: "var(--orange)" }}>
                <Icon name="WifiOff" size={12} />Офлайн
              </span>
            )}
            {!isOnline && (
              <div className="sm:hidden w-2 h-2 rounded-full" style={{ background: "var(--orange)" }} />
            )}
            <button onClick={() => setShowChat(true)} className="icon-btn">
              <Icon name="MessageSquare" size={17} style={{ color: "var(--blue)" }} />
            </button>
          </div>
        </header>

        {/* Offline banner */}
        {!isOnline && (
          <div className="offline-banner px-3 py-2 flex items-center gap-2 text-xs flex-shrink-0">
            <Icon name="WifiOff" size={12} style={{ color: "var(--orange)" }} />
            <span style={{ color: "var(--orange)" }}>Офлайн — изменения сохранятся при подключении</span>
          </div>
        )}

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
          <div key={page}>{pageComponents[page]}</div>
        </main>

        {/* Bottom tab bar (mobile) */}
        <nav className="lg:hidden tab-bar flex-shrink-0 flex items-center justify-around px-1 py-1"
          style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}>
          {navItems.slice(0, 5).map(item => {
            const active = page === item.id;
            return (
              <button key={item.id} onClick={() => navigate(item.id)}
                className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all min-w-[52px]"
                style={{ color: active ? "var(--orange)" : "var(--text-muted)" }}>
                <Icon name={item.icon} fallback="Circle" size={22} />
                <span className="text-[9px] font-semibold leading-none" style={{ letterSpacing: "-0.2px" }}>
                  {item.label}
                </span>
                {active && <div className="w-1 h-1 rounded-full mt-0.5" style={{ background: "var(--orange)" }} />}
              </button>
            );
          })}
          <button onClick={() => setShowChat(true)}
            className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl min-w-[52px]"
            style={{ color: "var(--blue)" }}>
            <Icon name="MessageSquare" size={22} />
            <span className="text-[9px] font-semibold leading-none">Чат</span>
          </button>
        </nav>
      </div>

      {showRegister && <RegisterForeman onClose={() => setShowRegister(false)} />}
    </div>
  );
}
