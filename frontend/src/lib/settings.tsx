import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { api } from "./api";
import { useAuth } from "./auth";

export type AppSettings = {
  business_name: string;
  labour_categories: string[];
  visit_purposes: string[];
  gates: string[];
};

const FALLBACK: AppSettings = {
  business_name: "DBS Factory",
  labour_categories: ["Welder", "Fitter", "Electrician", "Helper", "Carpenter", "Painter", "Other"],
  visit_purposes: ["Meeting", "Delivery", "Maintenance", "Interview", "Audit", "Other"],
  gates: ["Main Gate", "Gate 1", "Gate 2"],
};

type Ctx = {
  settings: AppSettings;
  refresh: () => Promise<void>;
};

const SettingsContext = createContext<Ctx | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(FALLBACK);

  const refresh = useCallback(async () => {
    try {
      const s = await api<AppSettings>("/settings");
      setSettings(s);
    } catch {
      // keep fallback
    }
  }, []);

  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  return <SettingsContext.Provider value={{ settings, refresh }}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be inside SettingsProvider");
  return ctx;
}
