export const API_BASE = import.meta.env.VITE_API_BASE || "https://smart-bot-api.vincere.uz/api";
export const API_BASE_MEDIA ="https://smart-bot-api.vincere.uz/media";

export const LS_ACCESS = "didox_access";
export const LS_REFRESH = "didox_refresh";

export interface AuthTokens {
  access: string;
  refresh: string;
}

