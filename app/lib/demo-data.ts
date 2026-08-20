import type { CalendarEvent, CalendarSummary } from "./calendar";

/**
 * Sample data for `?demo` — lets you see the UI without an OAuth client.
 * Times are relative to now so the countdown always has something to tick to.
 */
const MINUTE = 60_000;

const seed: Array<
  Partial<CalendarEvent> & {
    inMinutes: number;
    lengthMinutes: number;
    allDay?: boolean;
  }
> = [
  // Started at midnight, runs all day — must never win the countdown.
  { title: "Alex on leave", inMinutes: 0, lengthMinutes: 0, allDay: true },
  {
    title: "Design review",
    inMinutes: 47,
    lengthMinutes: 45,
    location: "Meet",
    hangoutLink: "https://meet.google.com/demo-demo-demo",
    attendees: 5,
  },
  { title: "1:1 with Sam", inMinutes: 190, lengthMinutes: 30, attendees: 2 },
  {
    title: "Sprint planning",
    inMinutes: 26 * 60,
    lengthMinutes: 60,
    attendees: 9,
  },
  {
    title: "Dentist",
    inMinutes: 50 * 60,
    lengthMinutes: 45,
    location: "12 High St",
  },
  { title: "Team offsite", inMinutes: 5 * 24 * 60, lengthMinutes: 480 },
];

const calendar: CalendarSummary = {
  id: "demo@example.com",
  summary: "Demo calendar",
  primary: true,
  backgroundColor: "#60a5fa",
};

export const demoCalendars: CalendarSummary[] = [calendar];

export function demoEvents(now = new Date()): CalendarEvent[] {
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return seed.map((item, index) => {
    if (item.allDay) {
      return {
        id: `demo-${index}`,
        calendarId: calendar.id,
        calendarSummary: calendar.summary,
        color: "#f59e0b",
        title: item.title ?? "Event",
        start: midnight,
        end: new Date(midnight.getTime() + 24 * 60 * MINUTE),
        allDay: true,
        attendees: 0,
      };
    }
    const start = new Date(now.getTime() + item.inMinutes * MINUTE);
    return {
      id: `demo-${index}`,
      calendarId: calendar.id,
      calendarSummary: calendar.summary,
      color: calendar.backgroundColor,
      title: item.title ?? "Event",
      location: item.location,
      hangoutLink: item.hangoutLink,
      start,
      end: new Date(start.getTime() + item.lengthMinutes * MINUTE),
      allDay: false,
      attendees: item.attendees ?? 0,
    };
  });
}
