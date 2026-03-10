import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { inputClass } from "./LoginPage";
import { API_BASE, type AuthTokens } from "../utils/consts";
import { authFetch } from "../utils/auth-fetch";

// ── Types & Constants ──────────────────────────────────────────────────────

interface CreateDocumentPageProps {
  tokens: AuthTokens;
  onTokensRefreshed: (tokens: AuthTokens) => void;
  onAuthFailed: () => void;
  onLogout: () => void;
}

const DOCUMENT_TYPES = [
  { value: "comparison_act", label: "Солиштирма далолатнома" },
  { value: "letter", label: "Хат" },
  { value: "contract", label: "Шартнома" },
  { value: "invoice", label: "Тўлов ҳисоби" },
  { value: "work_act", label: "Бажарилган ишлар далолатномаси" },
  { value: "other", label: "Бошқа" },
  { value: "application", label: "Ариза" },
  { value: "specification", label: "Спецификация" },
  { value: "additional_agreement", label: "Қўшимча келишув" },
];

// ── Schema ─────────────────────────────────────────────────────────────────

const schema = z.object({
  tin_or_pinfl: z
    .string()
    .min(9, "Минимум 9 символов")
    .max(14, "Максимум 14 символов")
    .regex(/^\d+$/, "Только цифры")
    .optional()
    .or(z.literal("")),
  document_number: z.string().min(1, "Обязательное поле"),
  document_date: z.string().min(1, "Укажите дату"),
  document_name: z.string().optional(),
  document_type: z.string().optional(),
  contract_number: z.string().optional(),
  contract_date: z.string().optional(),
  file: z.custom<FileList>().refine((f) => f && f.length > 0, "Выберите файл"),
});

type FormValues = z.infer<typeof schema>;

// ── Component ──────────────────────────────────────────────────────────────

export default function CreateDocumentPage({ tokens, onTokensRefreshed, onAuthFailed, onLogout }: CreateDocumentPageProps) {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    setServerError(null);
    try {
      const formData = new FormData();
      if (data.file?.[0]) formData.append("file", data.file[0]);
      formData.append("document_number", data.document_number);
      formData.append("document_date", data.document_date);
      if (data.document_name) formData.append("document_name", data.document_name);
      if (data.document_type) formData.append("document_type", data.document_type);
      if (data.contract_number) formData.append("contract_number", data.contract_number);
      if (data.contract_date) formData.append("contract_date", data.contract_date);
      if (data.tin_or_pinfl) formData.append("tin_or_pinfl", data.tin_or_pinfl);

      const res = await authFetch(
        `${API_BASE}/create/document/`,
        { method: "POST", body: formData },
        tokens,
        onTokensRefreshed,
        onAuthFailed
      );

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { detail?: string };
        throw new Error(err.detail || "Ошибка при создании документа");
      }

      setSuccess(true);
      reset();
      setFileName(null);
      setTimeout(() => setSuccess(false), 4000);
    } catch (e) {
      setServerError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur border-b border-zinc-800/60 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/30">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <p className="text-white font-bold text-sm leading-none">Создать документ</p>
        </div>
        <button
          onClick={onLogout}
          className="text-zinc-500 hover:text-zinc-300 transition-colors p-2 rounded-lg hover:bg-zinc-800/60"
          aria-label="Выйти"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>

      {/* Success toast */}
      {success && (
        <div className="mx-4 mt-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-emerald-400 text-sm font-medium">Документ успешно отправлен!</p>
        </div>
      )}

      {/* Form */}
      <div className="flex-1 px-6 py-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <SectionLabel label="Получатель" />
          <Field label="ИНН / ПИНФЛ получателя" error={errors.tin_or_pinfl?.message}>
            <input {...register("tin_or_pinfl")} inputMode="numeric" placeholder="123456789" className={inputClass(!!errors.tin_or_pinfl)} />
          </Field>

          <SectionLabel label="Сведения о документе" />
          <Field label="Номер документа *" error={errors.document_number?.message}>
            <input {...register("document_number")} placeholder="DOC-001" className={inputClass(!!errors.document_number)} />
          </Field>
          <Field label="Дата документа *" error={errors.document_date?.message}>
            <input {...register("document_date")} type="date" className={`${inputClass(!!errors.document_date)} [color-scheme:dark]`} />
          </Field>
          <Field label="Название документа" error={errors.document_name?.message}>
            <input {...register("document_name")} placeholder="Необязательно" className={inputClass(!!errors.document_name)} />
          </Field>
          <Field label="Тип документа" error={errors.document_type?.message}>
            <select {...register("document_type")} className={`${inputClass(!!errors.document_type)} appearance-none`}>
              <option value="" className="bg-zinc-900">Выберите тип</option>
              {DOCUMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value} className="bg-zinc-900">{t.label}</option>
              ))}
            </select>
          </Field>

          <SectionLabel label="Договор (необязательно)" />
          <Field label="Номер договора" error={errors.contract_number?.message}>
            <input {...register("contract_number")} placeholder="CNT-001" className={inputClass(!!errors.contract_number)} />
          </Field>
          <Field label="Дата договора" error={errors.contract_date?.message}>
            <input {...register("contract_date")} type="date" className={`${inputClass(!!errors.contract_date)} [color-scheme:dark]`} />
          </Field>

          <SectionLabel label="Файл" />
          <Field label="Прикрепить файл *" error={errors.file?.message as string | undefined}>
            <label className={`flex items-center gap-3 cursor-pointer w-full bg-zinc-900 border rounded-xl px-4 py-3.5 transition-all ${errors.file ? "border-red-500/60" : "border-zinc-800 hover:border-emerald-500/50"}`}>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                {fileName
                  ? <p className="text-emerald-400 text-sm font-medium truncate">{fileName}</p>
                  : <p className="text-zinc-500 text-sm">Нажмите для выбора файла</p>}
              </div>
              <input
                type="file"
                className="hidden"
                {...register("file")}
                onChange={(e) => {
                  void register("file").onChange(e);
                  setFileName(e.target.files?.[0]?.name ?? null);
                }}
              />
            </label>
          </Field>

          {serverError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-red-400 text-xs font-bold">!</span>
              </div>
              <p className="text-red-400 text-sm">{serverError}</p>
            </div>
          )}

          <div className="pt-2 pb-8">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/40 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-4 text-base transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Отправка...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  Отправить документ
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Shared UI ──────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-zinc-800" />
    </div>
  );
}

interface FieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ label, error, children }: FieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-2">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1.5 ml-1">{error}</p>}
    </div>
  );
}