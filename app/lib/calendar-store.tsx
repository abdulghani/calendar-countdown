import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  CLIENT_ID,
  clearToken,
  loadToken,
  requestAccessToken,
  revokeAccessToken,
  type StoredToken,
} from "./google-auth";
import {
  CalendarAuthError,
  listUpcomingEvents,
  type CalendarEvent,
  type CalendarSummary,
} from "./calendar";

import { demoCalendars, demoEvents } from "./demo-data";

/** Refetch events every 5 minutes while the tab is open. */
const REFRESH_MS = 5 * 60_000;

type Status = "signed-out" | "connecting" | "loading" | "ready" | "error";

type CalendarStore = {
  status: Status;
  configured: boolean;
  error: string | null;
  events: CalendarEvent[];
  calendars: CalendarSummary[];
  account: string | null;
  lastSyncedAt: Date | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  refresh: () => Promise<void>;
};

const CalendarContext = createContext<CalendarStore | null>(null);

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<StoredToken | null>(null);
  const [status, setStatus] = useState<Status>("signed-out");
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<CalendarSummary[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const tokenRef = useRef<StoredToken | null>(null);

  tokenRef.current = token;

  // `?demo` fills the UI with sample events — handy before OAuth is configured.
  const [demo] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("demo"),
  );

  // Restore a still-valid token from the previous page view in this tab.
  useEffect(() => {
    if (demo) {
      setEvents(demoEvents());
      setCalendars(demoCalendars);
      setLastSyncedAt(new Date());
      setStatus("ready");
      return;
    }
    const stored = loadToken();
    if (stored) {
      setToken(stored);
      setStatus("loading");
    }
  }, [demo]);

  const load = useCallback(async (active: StoredToken) => {
    setStatus("loading");
    setError(null);
    try {
      const result = await listUpcomingEvents(active.accessToken, { days: 60 });
      setEvents(result.events);
      setCalendars(result.calendars);
      setLastSyncedAt(new Date());
      setStatus("ready");
    } catch (cause) {
      if (cause instanceof CalendarAuthError) {
        clearToken();
        setToken(null);
        setStatus("signed-out");
        setError(cause.message);
        return;
      }
      setError(cause instanceof Error ? cause.message : String(cause));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    void load(token);
  }, [token, load]);

  // Background refresh — skipped while the tab is hidden.
  useEffect(() => {
    if (!token) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible" && tokenRef.current) {
        void load(tokenRef.current);
      }
    }, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [token, load]);

  const connect = useCallback(async () => {
    setStatus("connecting");
    setError(null);
    try {
      setToken(await requestAccessToken());
    } catch (cause) {
      setStatus("signed-out");
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }, []);

  const disconnect = useCallback(() => {
    if (tokenRef.current) revokeAccessToken(tokenRef.current.accessToken);
    clearToken();
    setToken(null);
    setEvents([]);
    setCalendars([]);
    setLastSyncedAt(null);
    setStatus("signed-out");
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    if (tokenRef.current) await load(tokenRef.current);
  }, [load]);

  const value = useMemo<CalendarStore>(
    () => ({
      status,
      configured: Boolean(CLIENT_ID),
      error,
      events,
      calendars,
      account: calendars.find((calendar) => calendar.primary)?.id ?? null,
      lastSyncedAt,
      connect,
      disconnect,
      refresh,
    }),
    [
      status,
      error,
      events,
      calendars,
      lastSyncedAt,
      connect,
      disconnect,
      refresh,
    ],
  );

  return (
    <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>
  );
}

export function useCalendar() {
  const store = useContext(CalendarContext);
  if (!store) {
    throw new Error("useCalendar must be used inside <CalendarProvider>");
  }
  return store;
}

/** A `Date` that re-renders on a fixed tick. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
