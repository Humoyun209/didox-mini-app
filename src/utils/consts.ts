export const API_BASE = import.meta.env.VITE_API_BASE || "https://smart-bot-api.vincere.uz/api";

export const LS_ACCESS = "didox_access";
export const LS_REFRESH = "didox_refresh";

export interface AuthTokens {
  access: string;
  refresh: string;
}

