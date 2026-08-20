import type { CalendarEvent } from "~/lib/calendar";
import { relativeLabel } from "~/lib/time";

export type RowState = "past" | "now" | "next" | "upcoming";

const dotClass: Record<RowState, string> = {
  past: "bg-white/15",
  now: "bg-emerald-400",
  next: "bg-amber-400",
  upcoming: "bg-white/20",
};

/**
 * One event as a full-width row: status dot, title over subtitle, a muted
 * relative label, and the start time in the right-hand column.
 */
export function EventRow({
  event,
  now,
  state,
}: {
  event: CalendarEvent;
  now: Date;
  state: RowState;
}) {
  const time = event.allDay
    ? "All day"
    : new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
      }).format(event.start);

  const subtitle =
    event.location ?? (event.attendees > 0
      ? `${event.attendees} guests`
      : event.calendarSummary);

  return (
    <li
      className={`flex items-center gap-4 px-5 py-4 transition-colors ${
        state === "now" ? "bg-emerald-400/[0.07]" : "hover:bg-white/[0.03]"
      }`}
    >
      <span
        aria-hidden
        className={`h-2 w-2 shrink-0 rounded-full ${dotClass[state]}`}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[0.95rem] font-medium text-white">
            {event.title}
          </p>
          {state === "now" && (
            <span className="shrink-0 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-emerald-300">
              Now
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-sm text-white/40">{subtitle}</p>
      </div>

      {/* An all-day entry has no meaningful start instant to count from. */}
      <span className="hidden shrink-0 text-sm text-white/35 sm:block">
        {event.allDay ? "" : relativeLabel(event.start, now)}
      </span>

      <span
        className={`shrink-0 text-right text-lg font-semibold tabular-nums sm:text-xl ${
          event.allDay ? "text-white/50" : "text-white"
        }`}
      >
        {time}
      </span>

      {event.hangoutLink && (
        <a
          href={event.hangoutLink}
          target="_blank"
          rel="noreferrer"
          title="Join call"
          aria-label={`Join call for ${event.title}`}
          className="shrink-0 text-sky-400 transition hover:text-sky-300"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path
              fill="currentColor"
              d="M4 6h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm15 3.5 3-2v9l-3-2v-5Z"
            />
          </svg>
        </a>
      )}
    </li>
  );
}
