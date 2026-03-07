import { useState, useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import CreateDocumentPage from "./pages/CreateDocumentPage";

const API_BASE = import.meta.env.VITE_API_BASE || "https://your-api.com/api";

interface TelegramUser {
  id: number;
  first_name: string;
  telegram_id: number;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        initData: string;
      };
    };
  }
}

export default function App() {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
    }

    const initData = tg?.initData || "";

    fetch(`${API_BASE}/telegram/auth/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ init_data: initData }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Telegram auth failed");
        return res.json() as Promise<TelegramUser>;
      })
      .then((data) => {
        setUser(data);
        setAuthLoading(false);
      })
      .catch((err: Error) => {
        setAuthError(err.message);
        setAuthLoading(false);
      });
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-zinc-400 text-sm font-medium tracking-wide">Инициализация...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-xl">!</span>
          </div>
          <p className="text-zinc-300 font-medium mb-1">Ошибка авторизации</p>
          <p className="text-zinc-500 text-sm">{authError}</p>
        </div>
      </div>
    );
  }

  return <MainRouter user={user!} apiBase={API_BASE} />;
}

interface MainRouterProps {
  user: TelegramUser;
  apiBase: string;
}

function MainRouter({ user, apiBase }: MainRouterProps) {
  const [page, setPage] = useState<"login" | "create">("login");

  const handleDidoxLogin = () => setPage("create");
  const handleLogout = () => setPage("login");

  if (page === "login") {
    return <LoginPage user={user} apiBase={apiBase} onSuccess={handleDidoxLogin} />;
  }

  return <CreateDocumentPage user={user} apiBase={apiBase} onLogout={handleLogout} />;
}