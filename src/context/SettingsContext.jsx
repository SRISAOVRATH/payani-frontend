import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "payani_settings_v1";

const DEFAULT_SETTINGS = {
  theme: "system",
  accent: "blue",
  fontSize: "medium",
  highContrast: false,
  compactMode: false,
  animations: true,

  liveRefresh: true,
  refreshInterval: 15,
  showVehicleNumber: true,

  busNotifications: true,
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return DEFAULT_SETTINGS;
    }

    const saved = JSON.parse(raw);

    return {
      ...DEFAULT_SETTINGS,
      ...saved,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadSettings);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(settings)
    );
  }, [settings]);

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      let activeTheme = settings.theme;

      if (settings.theme === "system") {
        activeTheme = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches
          ? "dark"
          : "light";
      }

      root.dataset.theme = activeTheme;
      root.dataset.accent = settings.accent;
      root.dataset.fontSize = settings.fontSize;

      root.classList.toggle(
        "high-contrast",
        settings.highContrast
      );

      root.classList.toggle(
        "compact-ui",
        settings.compactMode
      );

      root.classList.toggle(
        "no-animations",
        !settings.animations
      );
    };

    applyTheme();

    if (settings.theme !== "system") {
      return;
    }

    const mediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    const handleChange = () => {
      applyTheme();
    };

    mediaQuery.addEventListener(
      "change",
      handleChange
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        handleChange
      );
    };
  }, [
    settings.theme,
    settings.accent,
    settings.fontSize,
    settings.highContrast,
    settings.compactMode,
    settings.animations,
  ]);

  function showToast(message, type = "info") {
    setToast({
      id: Date.now(),
      message,
      type,
    });

    window.clearTimeout(
      showToast.timeoutId
    );

    showToast.timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 2600);
  }

  function updateSetting(key, value) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));

    const messages = {
      theme: `Theme changed to ${
        value === "system"
          ? "System"
          : value === "dark"
          ? "Dark"
          : "Light"
      }`,
      accent: `Accent changed to ${value}`,
      fontSize: "Text size updated",
      highContrast: value
        ? "High contrast enabled"
        : "High contrast disabled",
      compactMode: value
        ? "Compact interface enabled"
        : "Compact interface disabled",
      animations: value
        ? "Animations enabled"
        : "Animations disabled",
      liveRefresh: value
        ? "Live data refresh enabled"
        : "Live data refresh disabled",
      refreshInterval: `Refresh interval: ${value} seconds`,
      showVehicleNumber: value
        ? "Vehicle numbers are now visible"
        : "Vehicle numbers are now hidden",
      busNotifications: value
        ? "Bus notifications enabled"
        : "Bus notifications disabled",
    };

    if (messages[key]) {
      showToast(messages[key]);
    }
  }

  function resetSettings() {
    setSettings(DEFAULT_SETTINGS);
    showToast("PAYANI settings restored to default");
  }

  const value = useMemo(
    () => ({
      settings,
      updateSetting,
      resetSettings,
      showToast,
    }),
    [settings]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}

      {toast && (
        <div
          className={`payani-toast payani-toast-${toast.type}`}
          role="status"
        >
          <span className="payani-toast-dot" />
          {toast.message}
        </div>
      )}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error(
      "useSettings must be used inside SettingsProvider"
    );
  }

  return context;
}