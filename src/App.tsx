import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import CreateDocumentPage from "./pages/CreateDocumentPage";

export const API_BASE = import.meta.env.VITE_API_BASE || "https://bot.tavis.uz/api";

export default function App() {
  const [page, setPage] = useState<"login" | "create">("login");

  if (page === "login") {
    return <LoginPage onSuccess={() => setPage("create")} />;
  }

  return <CreateDocumentPage onLogout={() => setPage("login")} />;
}