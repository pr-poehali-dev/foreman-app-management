import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { getChat, sendMessage } from "@/lib/api";
import type { Message, User } from "@/lib/api";

interface Props { user: User; onClose: () => void }

export default function Chat({ user, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function load() {
    try {
      const msgs = await getChat();
      setMessages(msgs);
    } catch { /* offline */ }
    setLoading(false);
  }

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const msg = await sendMessage(text.trim());
      setMessages(prev => [...prev, msg]);
      setText('');
    } catch { /* ignore */ }
    setSending(false);
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('ru', { day: 'numeric', month: 'long' });
  }

  let lastDate = '';

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "var(--surface-1)" }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-3 sm:px-4 py-3 flex-shrink-0"
        style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--surface-4)" }}>
        {/* Back button — 44px */}
        <button
          onClick={onClose}
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--surface-3)", color: "var(--text-secondary)" }}>
          <Icon name="ArrowLeft" size={18} />
        </button>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(255,140,0,0.15)" }}>
          <Icon name="MessageSquare" size={18} style={{ color: "var(--orange)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-oswald font-semibold text-white tracking-wide">ОБЩИЙ ЧАТ</p>
          <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
            ИП МАСАЛОВ · {messages.length} сообщений
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--green)" }} />
          <span className="text-xs" style={{ color: "var(--green)" }}>Онлайн</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 flex flex-col gap-1">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Icon name="Loader2" size={24} className="animate-spin" style={{ color: "var(--text-muted)" }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3" style={{ color: "var(--text-muted)" }}>
            <Icon name="MessageSquare" size={40} />
            <p className="text-sm text-center">Пока нет сообщений. Начните общение!</p>
          </div>
        ) : (
          messages.map(m => {
            const isMe = m.login === user.login;
            const dateStr = m.created_at.split('T')[0];
            const showDate = dateStr !== lastDate;
            lastDate = dateStr;
            return (
              <div key={m.id}>
                {showDate && (
                  <div className="flex items-center gap-3 my-3">
                    <div className="flex-1 h-px" style={{ background: "var(--surface-4)" }} />
                    <span className="text-xs px-3 py-1 rounded-full whitespace-nowrap"
                      style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}>
                      {formatDate(m.created_at)}
                    </span>
                    <div className="flex-1 h-px" style={{ background: "var(--surface-4)" }} />
                  </div>
                )}
                <div className={`flex gap-2 mb-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 self-end"
                    style={{
                      background: m.role === 'manager' ? 'rgba(255,140,0,0.2)' : 'rgba(59,130,246,0.2)',
                      color: m.role === 'manager' ? 'var(--orange)' : 'var(--blue)',
                    }}>
                    {m.full_name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </div>
                  {/* Bubble — wider on mobile */}
                  <div className={`max-w-[85%] sm:max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className="flex items-center gap-2 mb-1 px-1 flex-wrap">
                      <span className="text-xs font-semibold" style={{ color: isMe ? "var(--orange)" : "var(--text-secondary)" }}>
                        {isMe ? 'Вы' : m.full_name.split(' ')[0]}
                      </span>
                      {m.role === 'manager' && (
                        <span className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: "rgba(255,140,0,0.15)", color: "var(--orange)", fontSize: 10 }}>
                          управленец
                        </span>
                      )}
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{formatTime(m.created_at)}</span>
                    </div>
                    <div
                      className="px-3 sm:px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                      style={{
                        background: isMe ? "var(--orange)" : "var(--surface-3)",
                        color: isMe ? "#000" : "var(--text-primary)",
                        borderBottomRightRadius: isMe ? 4 : undefined,
                        borderBottomLeftRadius: !isMe ? 4 : undefined,
                      }}>
                      {m.text}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input form — safe area bottom */}
      <form
        onSubmit={send}
        className="flex-shrink-0 px-3 sm:px-4 py-3 flex gap-2 items-center"
        style={{
          background: "var(--surface-2)",
          borderTop: "1px solid var(--surface-4)",
          paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Написать сообщение..."
          className="flex-1 px-4 py-3.5 rounded-xl text-base outline-none"
          style={{ background: "var(--surface-3)", border: "1px solid var(--surface-4)", color: "var(--text-primary)" }}
          onFocus={e => (e.target.style.borderColor = "var(--orange)")}
          onBlur={e => (e.target.style.borderColor = "var(--surface-4)")}
        />
        {/* Send button — 48px for easy tap */}
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
          style={{ background: text.trim() ? "var(--orange)" : "var(--surface-3)", color: text.trim() ? "#000" : "var(--text-muted)" }}>
          {sending
            ? <Icon name="Loader2" size={18} className="animate-spin" />
            : <Icon name="Send" size={18} />
          }
        </button>
      </form>
    </div>
  );
}
