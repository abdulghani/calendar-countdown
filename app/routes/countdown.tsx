import { Link } from "react-router";

import type { Route } from "./+types/countdown";
import { ConnectPanel } from "~/components/connect-panel";
import { CountdownClock } from "~/components/countdown-clock";
import { EmptyState, ErrorState, LoadingState } from "~/components/states";
import { remainingEvents } from "~/lib/calendar";
import { useCalendar, useNow } from "~/lib/calendar-store";
import { formatDayLabel, formatTimeRange, relativeLabel } from "~/lib/time";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Next up — Calendar Countdown" },
    {
      name: "description",
      content: "A live countdown to your next Google Calendar event.",
    },
  ];
}

export default function Countdown() {
  const { status, events, error, refresh } = useCalendar();
  const now = useNow(1000);

  if (status === "signed-out" || status === "connecting") {
    return <ConnectPanel />;
  }
  if (status === "error") {
    return <ErrorState message={error ?? "Something went wrong."} onRetry={() => void refresh()} />;
  }
  if (status === "loading" && events.length === 0) {
    return <LoadingState />;
  }

  // All-day entries are skipped — a countdown needs a real start time.
  const timed = remainingEvents(events, now);
  const next = timed[0];
  if (!next) {
    const allDayOnly = events.some((event) => event.allDay);
    return (
      <EmptyState
        title="Nothing scheduled"
        hint={
          allDayOnly
            ? "Only all-day entries ahead — those don't get a countdown."
            : "You're clear for the next 60 days."
        }
      />
    );
  }

  const started = next.start <= now;
  const upcoming = timed.slice(1, 4);

  return (
    <div className="flex flex-col items-center gap-10">
      <div className="text-center">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/35">
          {started ? "Happening now" : "Next up"}
        </p>
        <h1 className="mt-3 text-balance text-2xl font-semibold sm:text-3xl">
          {next.title}
        </h1>
        <p className="mt-2 text-sm text-white/45">
          {formatDayLabel(next.start, now)} ·{" "}
          {formatTimeRange(next.start, next.end, next.allDay)}
          {next.location ? ` · ${next.location}` : ""}
        </p>
      </div>

      <CountdownClock target={started ? next.end : next.start} now={now} />

      <p className="text-sm text-white/40">
        {started
          ? `Ends ${relativeLabel(next.end, now)}`
          : `Starts ${relativeLabel(next.start, now)}`}
      </p>

      {next.hangoutLink && (
        <a
          href={next.hangoutLink}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-sky-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-400"
        >
          Join video call
        </a>
      )}

      {upcoming.length > 0 && (
        <div className="w-full max-w-md border-t border-white/10 pt-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/30">
              After that
            </p>
            <Link
              to="/events"
              className="text-xs text-white/40 transition hover:text-white"
            >
              See all →
            </Link>
          </div>
          <ul className="space-y-2 text-sm">
            {upcoming.map((event) => (
              <li
                key={event.id}
                className="flex items-baseline justify-between gap-4"
              >
                <span className="truncate text-white/70">{event.title}</span>
                <span className="shrink-0 text-xs tabular-nums text-white/35">
                  {relativeLabel(event.start, now)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
