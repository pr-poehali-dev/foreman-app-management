import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Icon from "@/components/ui/icon";
import Login from "./pages/Login";
import ManagerDashboard from "./pages/ManagerDashboard";
import ForemanDashboard from "./pages/ForemanDashboard";
import { getMe } from "./lib/api";
import type { User } from "./lib/api";

const queryClient = new QueryClient();

function AppShell() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe().then(u => {
      setUser(u);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function handleLogin(u: User) {
    setUser(u);
  }

  function handleLogout() {
    setUser(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: "var(--surface-1)" }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--orange)", boxShadow: "0 0 30px rgba(255,140,0,0.4)" }}>
          <Icon name="HardHat" size={26} style={{ color: "#000" }} />
        </div>
        <div className="flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
          <Icon name="Loader2" size={18} className="animate-spin" />
          <span className="text-sm">Загрузка...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (user.role === 'manager') {
    return <ManagerDashboard user={user} onLogout={handleLogout} />;
  }

  return <ForemanDashboard user={user} onLogout={handleLogout} />;
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
