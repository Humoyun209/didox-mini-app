import { useState } from "react";
import { API_BASE } from "../App";

interface AuthResult {
  status: "idle" | "loading" | "ok" | "error";
  response?: unknown;
  error?: string;
  statusCode?: number;
}

interface ParsedInitData {
  [key: string]: string;
}

function parseInitData(raw: string): ParsedInitData {
  if (!raw) return {};
  try {
    return Object.fromEntries(new URLSearchParams(raw).entries());
  } catch {
    return { raw };
  }
}

export default function TelegramDebug() {
  const [open, setOpen] = useState(false);
  const [authResult, setAuthResult] = useState<AuthResult>({ status: "idle" });

  const tg = window.Telegram?.WebApp;
  const initData = tg?.initData || "";
  const parsed = parseInitData(initData);

  // Parse user field if exists
  let parsedUser: unknown = null;
  if (parsed.user) {
    try {
      parsedUser = JSON.parse(parsed.user);
    } catch {
      parsedUser = parsed.user;
    }
  }

  const sendAuth = async () => {
    setAuthResult({ status: "loading" });
    try {
      const res = await fetch(`${API_BASE}/telegram/auth/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ init_data: initData }),
      });
      const data = await res.json().catch(() => null);
      setAuthResult({
        status: res.ok ? "ok" : "error",
        statusCode: res.status,
        response: data,
        error: res.ok ? undefined : `HTTP ${res.status}`,
      });
    } catch (e) {
      setAuthResult({ status: "error", error: (e as Error).message });
    }
  };

  return (
    <div className="mx-4 mb-6 rounded-xl border border-zinc-800 overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900 hover:bg-zinc-800/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          <span className="text-yellow-400 text-xs font-mono font-semibold tracking-wide">
            TELEGRAM DEBUG
          </span>
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#71717a"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="bg-zinc-950 divide-y divide-zinc-800/60">

          {/* WebApp available? */}
          <DebugSection title="window.Telegram.WebApp">
            <Row
              label="доступен"
              value={tg ? "✅ да" : "❌ нет (не в Telegram)"}
              valueClass={tg ? "text-emerald-400" : "text-red-400"}
            />
            {tg && (
              <>
                <Row label="platform" value={String((tg as unknown as Record<string, unknown>).platform ?? "—")} />
                <Row label="version" value={String((tg as unknown as Record<string, unknown>).version ?? "—")} />
                <Row label="colorScheme" value={String((tg as unknown as Record<string, unknown>).colorScheme ?? "—")} />
              </>
            )}
          </DebugSection>

          {/* initData raw */}
          <DebugSection title="initData (raw)">
            {initData ? (
              <div className="font-mono text-xs text-zinc-300 break-all leading-relaxed bg-zinc-900 rounded-lg p-3">
                {initData}
              </div>
            ) : (
              <span className="text-zinc-500 text-xs">пусто — initData недоступен вне Telegram</span>
            )}
          </DebugSection>

          {/* Parsed fields */}
          {Object.keys(parsed).length > 0 && (
            <DebugSection title="initData (parsed)">
              {Object.entries(parsed).map(([k, v]) => (
                <Row
                  key={k}
                  label={k}
                  value={k === "user" ? JSON.stringify(parsedUser, null, 2) : v}
                  mono
                  wrap={k === "user"}
                />
              ))}
            </DebugSection>
          )}

          {/* Auth request */}
          <DebugSection title="POST /telegram/auth/">
            <button
              onClick={sendAuth}
              disabled={authResult.status === "loading"}
              className="mb-3 px-3 py-1.5 bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-400/30 text-yellow-400 text-xs font-mono rounded-lg transition-colors disabled:opacity-50"
            >
              {authResult.status === "loading" ? "Отправка..." : "Отправить запрос"}
            </button>

            {authResult.status !== "idle" && authResult.status !== "loading" && (
              <>
                <Row
                  label="статус"
                  value={`${authResult.statusCode ?? ""} ${authResult.status === "ok" ? "✅ OK" : "❌ Error"}`}
                  valueClass={authResult.status === "ok" ? "text-emerald-400" : "text-red-400"}
                />

                {/* If backend returned debug info, show it nicely */}
                {authResult.response &&
                  typeof authResult.response === "object" &&
                  (authResult.response as Record<string, unknown>).debug && (() => {
                    const dbg = (authResult.response as Record<string, unknown>).debug as Record<string, unknown>;
                    const hashMatch = dbg.hash_from_telegram === dbg.hash_computed;
                    return (
                      <div className="mt-3 space-y-2">
                        <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest">Backend debug</p>

                        <Row label="bot_token_set" value={String(dbg.bot_token_set)} valueClass={dbg.bot_token_set ? "text-emerald-400" : "text-red-400"} mono />
                        <Row label="bot_token_length" value={String(dbg.bot_token_length)} mono />
                        <Row label="parsed_fields" value={(dbg.parsed_fields as string[]).join(", ")} mono />

                        <div className="mt-1">
                          <p className="text-zinc-500 text-xs font-mono mb-1">data_check_string:</p>
                          <div className="font-mono text-xs text-zinc-300 bg-zinc-900 rounded p-2 break-all whitespace-pre-wrap leading-relaxed">
                            {String(dbg.data_check_string)}
                          </div>
                        </div>

                        <div className={`rounded-lg p-2 border ${hashMatch ? "border-emerald-500/40 bg-emerald-900/10" : "border-red-500/40 bg-red-900/10"}`}>
                          <p className={`text-xs font-mono font-bold mb-1 ${hashMatch ? "text-emerald-400" : "text-red-400"}`}>
                            {hashMatch ? "✅ Hashes match" : "❌ Hash mismatch"}
                          </p>
                          <p className="text-zinc-500 text-xs font-mono">from telegram:</p>
                          <p className="font-mono text-xs text-zinc-300 break-all">{String(dbg.hash_from_telegram)}</p>
                          <p className="text-zinc-500 text-xs font-mono mt-1">computed:</p>
                          <p className="font-mono text-xs text-zinc-300 break-all">{String(dbg.hash_computed)}</p>
                        </div>
                      </div>
                    );
                  })()
                }

                {/* Raw response */}
                <div className="mt-2 font-mono text-xs text-zinc-300 break-all leading-relaxed bg-zinc-900 rounded-lg p-3">
                  {JSON.stringify(authResult.response ?? authResult.error, null, 2)}
                </div>
              </>
            )}
          </DebugSection>

        </div>
      )}
    </div>
  );
}

// ── Mini UI ────────────────────────────────────────────────────────────────

function DebugSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3 space-y-2">
      <p className="text-zinc-600 text-xs font-mono uppercase tracking-widest mb-2">{title}</p>
      {children}
    </div>
  );
}

interface RowProps {
  label: string;
  value: string;
  valueClass?: string;
  mono?: boolean;
  wrap?: boolean;
}

function Row({ label, value, valueClass, mono, wrap }: RowProps) {
  return (
    <div className={`flex ${wrap ? "flex-col gap-1" : "items-start justify-between gap-3"}`}>
      <span className="text-zinc-500 text-xs font-mono flex-shrink-0">{label}:</span>
      <span
        className={`text-xs ${mono ? "font-mono" : ""} ${wrap ? "bg-zinc-900 rounded p-2 break-all leading-relaxed" : "text-right break-all"} ${valueClass ?? "text-zinc-300"}`}
      >
        {value}
      </span>
    </div>
  );
}