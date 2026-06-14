import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Icon from "@/components/ui/icon";
import Objects from "./pages/Objects";
import Timesheet from "./pages/Timesheet";
import Documents from "./pages/Documents";
import Photos from "./pages/Photos";
import Team from "./pages/Team";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const navItems = [
  { id: "objects",   label: "Объекты",     icon: "Building2",    badge: 2 },
  { id: "timesheet", label: "Табель",       icon: "CalendarDays", badge: 0 },
  { id: "documents", label: "Документы",    icon: "FolderOpen",   badge: 3 },
  { id: "photos",    label: "Фотоотчёты",   icon: "Camera",       badge: 0 },
  { id: "team",      label: "Команда",      icon: "Users",        badge: 0 },
  { id: "stats",     label: "Статистика",   icon: "BarChart3",    badge: 0 },
  { id: "settings",  label: "Настройки",    icon: "Settings",     badge: 0 },
];

const pageComponents: Record<string, React.ReactNode> = {
  objects: <Objects />,
  timesheet: <Timesheet />,
  documents: <Documents />,
  photos: <Photos />,
  team: <Team />,
  stats: <Stats />,
  settings: <Settings />,
};

function AppShell() {
  const [page, setPage] = useState("objects");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [syncPending, setSyncPending] = useState(!navigator.onLine);

  useEffect(() => {
    const up = () => {
      setIsOnline(true);
      if (syncPending) {
        setTimeout(() => setSyncPending(false), 2000);
      }
    };
    const down = () => {
      setIsOnline(false);
      setSyncPending(true);
    };
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, [syncPending]);

  const currentNav = navItems.find(n => n.id === page);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--surface-1)" }}>
      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 lg:hidden" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full z-40 w-64 flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "var(--surface-2)", borderRight: "1px solid var(--surface-4)" }}>

        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-3" style={{ borderBottom: "1px solid var(--surface-4)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "var(--orange)", boxShadow: "0 0 20px rgba(255,140,0,0.35)" }}>
            <Icon name="HardHat" size={18} style={{ color: "#000" }} />
          </div>
          <div>
            <div className="font-oswald text-white font-bold text-base leading-none tracking-wider">ПРОРАБ<span style={{ color: "var(--orange)" }}>ПРО</span></div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Управление стройкой</div>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <Icon name="X" size={18} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        {/* Online status */}
        <div className="mx-3 my-3 px-3 py-2.5 rounded-xl flex items-center gap-2.5"
          style={{ background: isOnline ? "rgba(34,197,94,0.08)" : "rgba(255,140,0,0.08)", border: `1px solid ${isOnline ? "rgba(34,197,94,0.2)" : "rgba(255,140,0,0.2)"}` }}>
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: isOnline ? "var(--green)" : "var(--orange)" }} />
          <span className="text-xs font-medium" style={{ color: isOnline ? "var(--green)" : "var(--orange)" }}>
            {isOnline ? "Онлайн" : "Офлайн — данные сохранены"}
          </span>
          {syncPending && isOnline && (
            <Icon name="RefreshCw" size={12} className="ml-auto animate-spin" style={{ color: "var(--green)" }} />
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          <div className="text-xs font-semibold uppercase tracking-widest mb-2 px-2" style={{ color: "var(--text-muted)" }}>
            Меню
          </div>
          {navItems.map(item => {
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setPage(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-left transition-all ${active ? "nav-active" : "hover:bg-white/5"}`}
                style={!active ? { color: "var(--text-secondary)" } : {}}>
                <Icon name={item.icon} fallback="Circle" size={18} style={{ color: active ? "var(--orange)" : "inherit" }} />
                <span className="text-sm font-medium">{item.label}</span>
                {item.badge > 0 && (
                  <span className="ml-auto w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: "var(--orange)", color: "#000" }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-4 py-4" style={{ borderTop: "1px solid var(--surface-4)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold"
              style={{ background: "rgba(255,140,0,0.15)", color: "var(--orange)" }}>
              АК
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Александр Крылов</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Управляющий</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--surface-4)" }}>
          <button className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "var(--surface-3)" }}
            onClick={() => setSidebarOpen(true)}>
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
                <Icon name="CloudOff" size={13} />
                Офлайн
              </div>
            )}
            <button className="w-9 h-9 rounded-xl flex items-center justify-center relative"
              style={{ background: "var(--surface-3)", color: "var(--text-secondary)" }}>
              <Icon name="Bell" size={17} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "var(--orange)" }} />
            </button>
          </div>
        </header>

        {/* Offline banner */}
        {!isOnline && (
          <div className="offline-banner px-4 py-2 flex items-center gap-2 text-xs flex-shrink-0">
            <Icon name="WifiOff" size={13} style={{ color: "var(--orange)" }} />
            <span style={{ color: "var(--orange)" }}>Работаете офлайн — все изменения сохранены и синхронизируются при подключении</span>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div key={page}>
            {pageComponents[page]}
          </div>
        </main>

        {/* Bottom tab bar (mobile) */}
        <nav className="lg:hidden tab-bar flex-shrink-0 flex items-center justify-around px-2 py-2">
          {navItems.slice(0, 5).map(item => {
            const active = page === item.id;
            return (
              <button key={item.id} onClick={() => setPage(item.id)}
                className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl relative transition-all"
                style={{ color: active ? "var(--orange)" : "var(--text-muted)" }}>
                <Icon name={item.icon} fallback="Circle" size={20} />
                <span className="text-[10px] font-medium">{item.label}</span>
                {item.badge > 0 && (
                  <span className="absolute top-0 right-2 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                    style={{ background: "var(--orange)", color: "#000" }}>
                    {item.badge}
                  </span>
                )}
                {active && (
                  <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: "var(--orange)" }} />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppShell />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
