import { useState } from "react";
import Icon from "@/components/ui/icon";
import { login } from "@/lib/api";
import type { User } from "@/lib/api";

interface Props { onLogin: (user: User) => void }

export default function Login({ onLogin }: Props) {
  const [loginVal, setLoginVal] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(loginVal.trim(), password);
      onLogin(data.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 grid-bg" style={{ background: "var(--surface-1)" }}>
      {/* Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-10"
          style={{ background: "var(--orange)" }} />
      </div>

      <div className="w-full max-w-sm relative animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--orange)", boxShadow: "0 0 40px rgba(255,140,0,0.4)" }}>
            <Icon name="HardHat" size={30} style={{ color: "#000" }} />
          </div>
          <h1 className="text-3xl font-oswald font-bold tracking-wider text-white">
            ПРОРАБ<span style={{ color: "var(--orange)" }}>ПРО</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>ИП МАСАЛОВ — управление строительством</p>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="app-card p-6 flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest mb-2 block" style={{ color: "var(--text-muted)" }}>
              Логин
            </label>
            <div className="relative">
              <Icon name="User" size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
              <input
                value={loginVal}
                onChange={e => setLoginVal(e.target.value)}
                placeholder="Введите логин"
                autoComplete="username"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ background: "var(--surface-3)", border: "1px solid var(--surface-4)", color: "var(--text-primary)" }}
                onFocus={e => (e.target.style.borderColor = "var(--orange)")}
                onBlur={e => (e.target.style.borderColor = "var(--surface-4)")}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-widest mb-2 block" style={{ color: "var(--text-muted)" }}>
              Пароль
            </label>
            <div className="relative">
              <Icon name="Lock" size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Введите пароль"
                autoComplete="current-password"
                required
                className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ background: "var(--surface-3)", border: "1px solid var(--surface-4)", color: "var(--text-primary)" }}
                onFocus={e => (e.target.style.borderColor = "var(--orange)")}
                onBlur={e => (e.target.style.borderColor = "var(--surface-4)")}
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}>
                <Icon name={showPass ? "EyeOff" : "Eye"} size={16} />
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
              style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
              <Icon name="AlertCircle" size={15} />
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="btn-orange w-full py-3 text-sm font-bold flex items-center justify-center gap-2 mt-1"
            style={{ opacity: loading ? 0.7 : 1 }}>
            {loading ? (
              <><Icon name="Loader2" size={16} className="animate-spin" /> Вход...</>
            ) : (
              <><Icon name="LogIn" size={16} /> Войти</>
            )}
          </button>
        </form>

        <p className="text-center text-xs mt-4" style={{ color: "var(--text-muted)" }}>
          Доступ только для сотрудников ИП МАСАЛОВ
        </p>
      </div>
    </div>
  );
}
