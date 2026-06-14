import { useState } from "react";
import Icon from "@/components/ui/icon";
import { registerForeman } from "@/lib/api";

interface Props { onClose: () => void }

export default function RegisterForeman({ onClose }: Props) {
  const [form, setForm] = useState({ login: '', password: '', full_name: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const res = await registerForeman(form);
      setSuccess(`Прораб ${res.full_name} зарегистрирован! Логин: ${res.login}`);
      setForm({ login: '', password: '', full_name: '', phone: '' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-md animate-fade-in">
        <div className="app-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(34,197,94,0.15)" }}>
              <Icon name="UserPlus" size={20} style={{ color: "var(--green)" }} />
            </div>
            <div>
              <h2 className="font-oswald text-xl font-bold text-white tracking-wide">ДОБАВИТЬ ПРОРАБА</h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Новый сотрудник ИП МАСАЛОВ</p>
            </div>
            <button onClick={onClose} className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}>
              <Icon name="X" size={16} />
            </button>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            {[
              { key: 'full_name', label: 'ФИО', placeholder: 'Иванов Иван Иванович', icon: 'User' },
              { key: 'login',     label: 'Логин', placeholder: 'Ivanov_Ivan', icon: 'AtSign' },
              { key: 'password',  label: 'Пароль', placeholder: 'Минимум 4 символа', icon: 'Lock' },
              { key: 'phone',     label: 'Телефон (необязательно)', placeholder: '+7 900 000-00-00', icon: 'Phone' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: "var(--text-muted)" }}>
                  {f.label}
                </label>
                <div className="relative">
                  <Icon name={f.icon} fallback="Circle" size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                  <input
                    value={form[f.key as keyof typeof form]}
                    onChange={e => set(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    type={f.key === 'password' ? 'password' : 'text'}
                    required={f.key !== 'phone'}
                    className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: "var(--surface-3)", border: "1px solid var(--surface-4)", color: "var(--text-primary)" }}
                    onFocus={e => (e.target.style.borderColor = "var(--green)")}
                    onBlur={e => (e.target.style.borderColor = "var(--surface-4)")}
                  />
                </div>
              </div>
            ))}

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
                style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                <Icon name="AlertCircle" size={15} />{error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
                style={{ background: "rgba(34,197,94,0.1)", color: "var(--green)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <Icon name="CheckCircle2" size={15} />{success}
              </div>
            )}

            <div className="flex gap-3 mt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 rounded-xl text-sm font-medium"
                style={{ background: "var(--surface-3)", color: "var(--text-secondary)", border: "1px solid var(--surface-4)" }}>
                Отмена
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                style={{ background: "var(--green)", color: "#000", opacity: loading ? 0.7 : 1 }}>
                {loading ? <><Icon name="Loader2" size={16} className="animate-spin" />Создание...</> : <><Icon name="UserPlus" size={16} />Создать</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
