import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { API_BASE, type AuthTokens } from "../utils/consts";
import { authFetch } from "../utils/auth-fetch";
import TelegramDebug from "../components/TelegramDebug";

interface LoginPageProps {
  tokens: AuthTokens;
  onTokensRefreshed: (tokens: AuthTokens) => void;
  onAuthFailed: () => void;
  onSuccess: () => void;
}

const schema = z.object({
  stir: z
    .string()
    .min(9, "Минимум 9 символов")
    .max(14, "Максимум 14 символов")
    .regex(/^\d+$/, "Только цифры"),
  password: z.string().min(1, "Введите пароль"),
});

type LoginFormValues = z.infer<typeof schema>;

export default function LoginPage({ tokens, onTokensRefreshed, onAuthFailed, onSuccess }: LoginPageProps) {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setServerError(null);
    try {
      const res = await authFetch(
        `${API_BASE}/didox/auth/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
        tokens,
        onTokensRefreshed,
        onAuthFailed
      );

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { detail?: string };
        throw new Error(err.detail || "Неверный логин или пароль");
      }

      onSuccess();
    } catch (e) {
      setServerError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <div className="pt-14 pb-8 px-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Didox</span>
        </div>
        <h1 className="text-white text-2xl font-bold tracking-tight leading-tight">Вход в аккаунт</h1>
        <p className="text-zinc-500 text-sm mt-1.5">Введите данные Didox для продолжения</p>
      </div>

      <div className="flex-1 px-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="ИНН / ПИНФЛ" error={errors.stir?.message}>
            <input
              {...register("stir")}
              inputMode="numeric"
              placeholder="123456789"
              className={inputClass(!!errors.stir)}
            />
          </Field>

          <Field label="Пароль" error={errors.password?.message}>
            <input
              {...register("password")}
              type="password"
              placeholder="••••••••"
              className={inputClass(!!errors.password)}
            />
          </Field>

          {serverError && <ErrorAlert message={serverError} />}

          <div className="pt-2">
            <SubmitButton loading={loading} label="Войти" loadingLabel="Вход..." />
          </div>
        </form>
      </div>

      <div className="pb-8 px-6">
        <p className="text-center text-zinc-600 text-xs">Powered by Didox · ЭДО платформа</p>
      </div>

      {/* <TelegramDebug tokens={tokens} /> */}
    </div>
  );
}

// ── Shared UI ──────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ label, error, children }: FieldProps) {
  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">
        {label}
      </label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1.5 ml-1">{error}</p>}
    </div>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
      <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-red-400 text-xs font-bold">!</span>
      </div>
      <p className="text-red-400 text-sm">{message}</p>
    </div>
  );
}

interface SubmitButtonProps {
  loading: boolean;
  label: string;
  loadingLabel: string;
}

function SubmitButton({ loading, label, loadingLabel }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/40 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-4 text-base transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20"
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {loadingLabel}
        </span>
      ) : label}
    </button>
  );
}

export function inputClass(hasError: boolean): string {
  return `w-full bg-zinc-900 border rounded-xl px-4 py-3.5 text-white text-base placeholder-zinc-600 outline-none transition-all ${
    hasError
      ? "border-red-500/60 focus:border-red-500"
      : "border-zinc-800 focus:border-emerald-500"
  }`;
}