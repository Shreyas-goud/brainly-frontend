import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useContent, type Content } from "../hooks/useContent";
import { fetchMe, fetchToday, type Me, type TodayRun } from "../lib/runApi";
import { normalizeError, type AppError } from "../lib/api";

type Modals = {
  openSave: (link?: string) => void;
  openItem: (item: Content) => void;
  openCapture: () => void;
  openShare: () => void;
  openSearch: () => void;
};

type AppDataValue = ReturnType<typeof useContent> & {
  today: TodayRun | null;
  todayLoading: boolean;
  todayError: AppError | null;
  refreshToday: () => Promise<void>;
  me: Me | null;
  refreshMe: () => Promise<void>;
  /** Refetch everything that a change to one save can affect. */
  refreshAll: () => void;
  modals: Modals;
};

const AppDataContext = createContext<AppDataValue | null>(null);

export function AppDataProvider({ children, modals }: { children: ReactNode; modals: Modals }) {
  const content = useContent();
  const [today, setToday] = useState<TodayRun | null>(null);
  const [todayLoading, setTodayLoading] = useState(true);
  const [todayError, setTodayError] = useState<AppError | null>(null);
  const [me, setMe] = useState<Me | null>(null);

  const refreshToday = useCallback(async () => {
    try {
      setToday(await fetchToday());
      setTodayError(null);
    } catch (err) {
      setTodayError(normalizeError(err));
    } finally {
      setTodayLoading(false);
    }
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      setMe(await fetchMe());
    } catch {
      /* the shell still works without the account details */
    }
  }, []);

  const { refresh } = content;
  const refreshAll = useCallback(() => {
    refresh();
    refreshToday();
    refreshMe();
  }, [refresh, refreshToday, refreshMe]);

  useEffect(() => {
    refreshToday();
    refreshMe();
  }, [refreshToday, refreshMe]);

  return (
    <AppDataContext.Provider
      value={{ ...content, today, todayLoading, todayError, refreshToday, me, refreshMe, refreshAll, modals }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData(): AppDataValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within <AppDataProvider>");
  return ctx;
}
