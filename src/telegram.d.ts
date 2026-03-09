interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  initData: string;
  platform: string;
  version: string;
  colorScheme: "light" | "dark";
}

interface Window {
  Telegram?: {
    WebApp: TelegramWebApp;
  };
}
