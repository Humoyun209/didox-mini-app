import { useState, useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import CreateDocumentPage from "./pages/CreateDocumentPage";
import { clearTokens, loadTokens, saveTokens } from "./utils/auth";
import { API_BASE, type AuthTokens } from "./utils/consts";




export default function App() {
  const [page, setPage] = useState<"login" | "create">("login");
  const [tokens, setTokens] = useState(() => loadTokens());
  const [tgLoading, setTgLoading] = useState(() => loadTokens() === null);
  const [tgError, setTgError] = useState<string | null>(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
    }

    fetch(`${API_BASE}/telegram/auth/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ init_data: tg?.initData || "" }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Telegram auth failed: ${res.status}`);
        return res.json() as Promise<{ access: string; refresh: string }>;
      })
      .then((data) => {
        const t = { access: data.access, refresh: data.refresh };
        saveTokens(t);
        setTokens(t);
        setTgLoading(false);
      })
      .catch((e: Error) => {
        setTgError(e.message);
        setTgLoading(false);
      });
  }, []);

  const handleTokensRefreshed = (t: AuthTokens) => {
    saveTokens(t);
    setTokens(t);
  };

  const handleAuthFailed = () => {
    clearTokens();
    setTokens(null);
    setPage("login");
    setTgError("Сессия истекла, перезапустите приложение");
  };

  if (tgLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-zinc-400 text-sm font-medium tracking-wide">Инициализация...</p>
        </div>
      </div>
    );
  }

  if (tgError) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-xl">!</span>
          </div>
          <p className="text-zinc-300 font-medium mb-1">Ошибка авторизации</p>
          <p className="text-zinc-500 text-sm">{tgError}</p>
        </div>
      </div>
    );
  }

  if (page === "login") {
    return (
      <LoginPage
        tokens={tokens!}
        onTokensRefreshed={handleTokensRefreshed}
        onAuthFailed={handleAuthFailed}
        onSuccess={() => setPage("create")}
      />
    );
  }

  return (
    <CreateDocumentPage
      tokens={tokens!}
      onTokensRefreshed={handleTokensRefreshed}
      onAuthFailed={handleAuthFailed}
      onLogout={() => setPage("login")}
    />
  );
}