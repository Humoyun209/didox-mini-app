import { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage";
import CreateDocumentPage from "./pages/CreateDocumentPage";
import { saveTokens, clearTokens } from "./utils/auth";
import { API_BASE, type AuthTokens } from "./utils/consts";
import { authFetch } from "./utils/auth-fetch";

type AppState = "loading" | "didox_login" | "app" | "error";

export default function App() {
  const [state, setState] = useState<AppState>("loading");
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        return res.json();
      })
      .then((data) => {
        const t = { access: data.access, refresh: data.refresh };

        saveTokens(t); // можно оставить, но не критично
        setTokens(t);

        const hasDidox = localStorage.getItem("didox_auth") === "true";

        if (hasDidox) {
          setState("app");
        } else {
          setState("didox_login");
        }
      })
      .catch((e: Error) => {
        setError(e.message);
        setState("error");
      });
  }, []);

  const handleTokensRefreshed = (t: AuthTokens) => {
    saveTokens(t);
    setTokens(t);
  };

  const handleAuthFailed = () => {
    clearTokens();
    localStorage.removeItem("didox_auth");
    setState("didox_login");
  };

  const handleDidoxSuccess = () => {
    localStorage.setItem("didox_auth", "true");
    setState("app");
  };

  const handleLogout = async () => {
  try {
      await authFetch(
        `${API_BASE}/didox/logout/`,
        { method: "POST" },
        tokens!,
        handleTokensRefreshed,
        handleAuthFailed
      );
    } catch {
      // игнорируем ошибку — всё равно разлогиниваем
    } finally {
      localStorage.removeItem("didox_auth");
      setState("didox_login");
    }
  };

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400">Инициализация...</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (state === "didox_login") {
    return (
      <LoginPage
        tokens={tokens!}
        onTokensRefreshed={handleTokensRefreshed}
        onAuthFailed={handleAuthFailed}
        onSuccess={handleDidoxSuccess}
      />
    );
  }

  return (
    <CreateDocumentPage
      tokens={tokens!}
      onTokensRefreshed={handleTokensRefreshed}
      onAuthFailed={handleAuthFailed}
      onLogout={handleLogout}
    />
  );
}