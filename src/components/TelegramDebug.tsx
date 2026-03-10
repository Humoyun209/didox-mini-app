import { useState } from "react";
import { API_BASE, type AuthTokens } from "../utils/consts";

interface TelegramDebugProps {
  tokens: AuthTokens | null;
}

interface RequestLog {
  status: "idle" | "loading" | "ok" | "error";
  httpStatus?: number;
  response?: unknown;
  error?: string;
}

export default function TelegramDebug({ tokens }: TelegramDebugProps) {
  const [open, setOpen] = useState(true);
  const [tgAuth, setTgAuth] = useState<RequestLog>({ status: "idle" });
  const [didoxAuth, setDidoxAuth] = useState<RequestLog>({ status: "idle" });
  const [stir, setStir] = useState("");
  const [password, setPassword] = useState("");

  const tg = window.Telegram?.WebApp;
  const initData = tg?.initData || "";

  // Parse initData
  const parsed = initData ? Object.fromEntries(new URLSearchParams(initData).entries()) : {};
  let parsedUser: Record<string, unknown> | null = null;
  if (parsed.user) {
    try { parsedUser = JSON.parse(parsed.user); } catch { /* ignore */ }
  }

  const sendTgAuth = async () => {
    setTgAuth({ status: "loading" });
    try {
      const res = await fetch(`${API_BASE}/telegram/auth/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ init_data: initData }),
      });
      const data = await res.json().catch(() => null);
      setTgAuth({ status: res.ok ? "ok" : "error", httpStatus: res.status, response: data });
    } catch (e) {
      setTgAuth({ status: "error", error: (e as Error).message });
    }
  };

  const sendDidoxAuth = async () => {
    if (!tokens) {
      setDidoxAuth({ status: "error", error: "Нет JWT токена" });
      return;
    }
    setDidoxAuth({ status: "loading" });
    try {
      const res = await fetch(`${API_BASE}/didox/auth/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${tokens.access}`,
        },
        body: JSON.stringify({ stir, password }),
      });
      const data = await res.json().catch(() => null);
      setDidoxAuth({ status: res.ok ? "ok" : "error", httpStatus: res.status, response: data });
    } catch (e) {
      setDidoxAuth({ status: "error", error: (e as Error).message });
    }
  };

  return (
    <div className="mx-4 mb-6 rounded-xl border border-yellow-500/20 overflow-hidden text-xs font-mono">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-yellow-500/5 hover:bg-yellow-500/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
          <span className="text-yellow-400 text-xs font-mono font-semibold tracking-widest uppercase">debug</span>
        </div>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a16207" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="bg-zinc-950/90 divide-y divide-zinc-800/50">

          {/* initData */}
          <Section title="initData">
            {!initData ? (
              <p className="text-zinc-600">— пусто (не в Telegram)</p>
            ) : (
              <>
                {parsedUser && (
                  <div className="bg-zinc-900 rounded-lg p-3 space-y-1 mb-2">
                    <p className="text-zinc-500 mb-1">user:</p>
                    {Object.entries(parsedUser).map(([k, v]) => (
                      <Row key={k} label={k} value={String(v)} />
                    ))}
                  </div>
                )}
                {Object.entries(parsed)
                  .filter(([k]) => k !== "user")
                  .map(([k, v]) => (
                    <Row key={k} label={k} value={k === "hash" ? `${v.slice(0, 16)}...` : v} />
                  ))}
              </>
            )}
          </Section>

          {/* JWT токены */}
          <Section title="JWT tokens">
            {tokens ? (
              <>
                <Row label="access" value={`${tokens.access.slice(0, 20)}...`} valueClass="text-emerald-400" />
                <Row label="refresh" value={`${tokens.refresh.slice(0, 20)}...`} valueClass="text-emerald-400" />
              </>
            ) : (
              <p className="text-red-400">— токенов нет</p>
            )}
          </Section>

          {/* POST /telegram/auth/ */}
          <Section title="POST /telegram/auth/">
            <DebugButton onClick={sendTgAuth} loading={tgAuth.status === "loading"} label="Отправить" />
            <RequestResult log={tgAuth} />
          </Section>

          {/* POST /didox/auth/ */}
          <Section title="POST /didox/auth/">
            <input
              value={stir}
              onChange={(e) => setStir(e.target.value)}
              placeholder="ИНН / ПИНФЛ"
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-zinc-200 placeholder-zinc-600 outline-none focus:border-yellow-500/50 mb-2"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Пароль"
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-zinc-200 placeholder-zinc-600 outline-none focus:border-yellow-500/50 mb-2"
            />
            <DebugButton onClick={sendDidoxAuth} loading={didoxAuth.status === "loading"} label="Отправить" />
            <RequestResult log={didoxAuth} />
          </Section>

        </div>
      )}
    </div>
  );
}

// ── UI helpers ─────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3 space-y-1.5">
      <p className="text-zinc-600 text-xs uppercase tracking-widest mb-2">{title}</p>
      {children}
    </div>
  );
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between items-start gap-3">
      <span className="text-zinc-500 flex-shrink-0">{label}:</span>
      <span className={`text-right break-all ${valueClass ?? "text-zinc-300"}`}>{value}</span>
    </div>
  );
}

function DebugButton({ onClick, loading, label }: { onClick: () => void; loading: boolean; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 mb-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg transition-colors disabled:opacity-40"
    >
      {loading && <span className="w-3 h-3 border border-zinc-500 border-t-zinc-300 rounded-full animate-spin" />}
      {loading ? "отправка..." : label}
    </button>
  );
}

function RequestResult({ log }: { log: RequestLog }) {
  if (log.status === "idle" || log.status === "loading") return null;
  return (
    <div className="mt-1 space-y-1.5">
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border ${
        log.status === "ok"
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          : "bg-red-500/10 text-red-400 border-red-500/20"
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${log.status === "ok" ? "bg-emerald-400" : "bg-red-400"}`} />
        {log.httpStatus} {log.status === "ok" ? "OK" : "Error"}
      </span>
      <pre className="bg-zinc-900 rounded-lg p-3 text-zinc-300 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
        {JSON.stringify(log.response ?? log.error, null, 2)}
      </pre>
    </div>
  );
}