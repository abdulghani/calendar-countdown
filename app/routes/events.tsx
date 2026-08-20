import { useMemo } from "react";

import type { Route } from "./+types/events";
import { ConnectPanel } from "~/components/connect-panel";
import { EventRow, type RowState } from "~/components/event-row";
import { EmptyState, ErrorState, LoadingState } from "~/components/states";
import type { CalendarEvent } from "~/lib/calendar";
import { useCalendar, useNow } from "~/lib/calendar-store";
import { formatDayLabel } from "~/lib/time";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Upcoming — Calendar Countdown" }];
}

export default function Events() {
  const { status, events, error, refresh } = useCalendar();
  // Minute ticks are enough here — nothing on this screen counts seconds.
  const now = useNow(30_000);

  const grouped = useMemo(() => groupByDay(events, now), [events, now]);
  // The first not-yet-started timed event gets the amber "up next" dot.
  const nextId = useMemo(
    () => events.find((event) => !event.allDay && event.start > now)?.id,
    [events, now],
  );

  if (status === "signed-out" || status === "connecting") {
    return <ConnectPanel />;
  }
  if (status === "error") {
    return <ErrorState message={error ?? "Something went wrong."} onRetry={() => void refresh()} />;
  }
  if (status === "loading" && events.length === 0) {
    return <LoadingState />;
  }
  if (events.length === 0) {
    return <EmptyState title="No upcoming events" hint="Next 60 days are empty." />;
  }

  return (
    <div className="w-full self-start">
      <h1 className="mb-6 text-xl font-semibold">Upcoming</h1>
      <div className="space-y-8">
        {grouped.map(([label, dayEvents]) => (
          <section key={label}>
            <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-white/30">
              {label}
            </h2>
            <ul className="divide-y divide-white/[0.07] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
              {dayEvents.map((event) => (
                <EventRow
                  key={event.id}
                  event={event}
                  now={now}
                  state={rowState(event, now, nextId)}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function rowState(
  event: CalendarEvent,
  now: Date,
  nextId: string | undefined,
): RowState {
  if (!event.allDay && event.start <= now && event.end > now) return "now";
  if (event.id === nextId) return "next";
  if (event.end <= now) return "past";
  return "upcoming";
}

function groupByDay(events: CalendarEvent[], now: Date) {
  const groups = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const label = formatDayLabel(event.start, now);
    const bucket = groups.get(label);
    if (bucket) bucket.push(event);
    else groups.set(label, [event]);
  }
  return [...groups.entries()];
}
