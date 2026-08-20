/** Minimal Google Calendar API v3 client (REST + Bearer token, no gapi). */

const API = "https://www.googleapis.com/calendar/v3";

export class CalendarAuthError extends Error {}

type ApiErrorBody = {
  error?: {
    message?: string;
    status?: string;
    errors?: Array<{ reason?: string; message?: string }>;
  };
};

/** Pull Google's own message/reason out of an error response. */
async function readApiError(response: Response) {
  const raw = await response.text().catch(() => "");
  try {
    const body = JSON.parse(raw) as ApiErrorBody;
    return {
      message: body.error?.message,
      reason: body.error?.errors?.[0]?.reason ?? body.error?.status,
    };
  } catch {
    return { message: raw.slice(0, 300) || undefined, reason: undefined };
  }
}

export type CalendarSummary = {
  id: string;
  summary: string;
  primary: boolean;
  backgroundColor?: string;
};

export type CalendarEvent = {
  id: string;
  calendarId: string;
  calendarSummary: string;
  color?: string;
  title: string;
  description?: string;
  location?: string;
  hangoutLink?: string;
  htmlLink?: string;
  /** Resolved start/end instants. */
  start: Date;
  end: Date;
  allDay: boolean;
  attendees: number;
  status?: string;
};

type ApiEvent = {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  hangoutLink?: string;
  htmlLink?: string;
  status?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: unknown[];
};

async function apiGet<T>(
  path: string,
  token: string,
  params: Record<string, string> = {},
): Promise<T> {
  const url = new URL(`${API}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.ok) return (await response.json()) as T;

  const { message, reason } = await readApiError(response);

  // Only a dead/insufficient token is worth prompting a reconnect for. Other
  // 403s (API disabled, quota, rate limit) are config problems — show them.
  const tokenIsDead =
    response.status === 401 ||
    (response.status === 403 &&
      ["authError", "insufficientPermissions", "forbidden"].includes(
        reason ?? "",
      ));

  if (tokenIsDead) {
    throw new CalendarAuthError(
      message
        ? `Google rejected the token: ${message}`
        : "Google access expired — reconnect to continue.",
    );
  }

  throw new Error(
    `Calendar API ${response.status}${reason ? ` (${reason})` : ""}: ${
      message || response.statusText
    }`,
  );
}

export async function listCalendars(token: string): Promise<CalendarSummary[]> {
  const data = await apiGet<{
    items?: Array<{
      id: string;
      summary?: string;
      primary?: boolean;
      selected?: boolean;
      backgroundColor?: string;
      accessRole?: string;
    }>;
  }>("/users/me/calendarList", token, { minAccessRole: "reader" });

  return (data.items ?? [])
    .filter((item) => item.selected !== false)
    .map((item) => ({
      id: item.id,
      summary: item.summary ?? item.id,
      primary: Boolean(item.primary),
      backgroundColor: item.backgroundColor,
    }));
}

function toEvent(
  raw: ApiEvent,
  calendar: CalendarSummary,
): CalendarEvent | null {
  const startRaw = raw.start?.dateTime ?? raw.start?.date;
  const endRaw = raw.end?.dateTime ?? raw.end?.date;
  if (!startRaw || !endRaw) return null;

  const allDay = !raw.start?.dateTime;
  return {
    id: `${calendar.id}:${raw.id}`,
    calendarId: calendar.id,
    calendarSummary: calendar.summary,
    color: calendar.backgroundColor,
    title: raw.summary ?? "(no title)",
    description: raw.description,
    location: raw.location,
    hangoutLink: raw.hangoutLink,
    htmlLink: raw.htmlLink,
    // All-day dates are floating (`YYYY-MM-DD`); parse them in local time.
    start: allDay ? localMidnight(startRaw) : new Date(startRaw),
    end: allDay ? localMidnight(endRaw) : new Date(endRaw),
    allDay,
    attendees: raw.attendees?.length ?? 0,
    status: raw.status,
  };
}

function localMidnight(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export type FetchOptions = {
  /** How far ahead to look. */
  days?: number;
  includeAllDay?: boolean;
  calendarIds?: string[];
};

/** Upcoming events across the user's calendars, merged and sorted by start. */
export async function listUpcomingEvents(
  token: string,
  options: FetchOptions = {},
): Promise<{ events: CalendarEvent[]; calendars: CalendarSummary[] }> {
  const { days = 30, includeAllDay = true, calendarIds } = options;

  const allCalendars = await listCalendars(token);
  const calendars = calendarIds?.length
    ? allCalendars.filter((calendar) => calendarIds.includes(calendar.id))
    : allCalendars;

  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + days * 86_400_000).toISOString();

  const perCalendar = await Promise.all(
    calendars.map(async (calendar) => {
      const data = await apiGet<{ items?: ApiEvent[] }>(
        `/calendars/${encodeURIComponent(calendar.id)}/events`,
        token,
        {
          timeMin,
          timeMax,
          singleEvents: "true", // expand recurring events into instances
          orderBy: "startTime",
          maxResults: "50",
          showDeleted: "false",
        },
      );
      return (data.items ?? [])
        .map((raw) => toEvent(raw, calendar))
        .filter((event): event is CalendarEvent => event !== null);
    }),
  );

  const events = perCalendar
    .flat()
    .filter((event) => event.status !== "cancelled")
    .filter((event) => includeAllDay || !event.allDay)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  return { events, calendars: allCalendars };
}

/**
 * Events that have not ended yet. All-day entries are excluded by default:
 * they have no meaningful start time, so counting down to them is noise.
 */
export function remainingEvents(
  events: CalendarEvent[],
  now = new Date(),
  { includeAllDay = false } = {},
): CalendarEvent[] {
  return events.filter(
    (event) =>
      event.end.getTime() > now.getTime() && (includeAllDay || !event.allDay),
  );
}

/** First timed event that has not ended yet — the one worth counting down to. */
export function nextEvent(
  events: CalendarEvent[],
  now = new Date(),
  options?: { includeAllDay?: boolean },
): CalendarEvent | undefined {
  return remainingEvents(events, now, options)[0];
}
