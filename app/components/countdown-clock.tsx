import { countdownTo, pad } from "~/lib/time";

type Props = {
  target: Date;
  now: Date;
  /** Dim the day block when the event is close, to keep focus on the live digits. */
  compact?: boolean;
};

export function CountdownClock({ target, now, compact = false }: Props) {
  const { days, hours, minutes, seconds, elapsed } = countdownTo(target, now);
  const showDays = days > 0;

  const units: Array<[string, string]> = [
    ...(showDays
      ? [[String(days), days === 1 ? "day" : "days"] as [string, string]]
      : []),
    [pad(hours), "hrs"],
    [pad(minutes), "min"],
    [pad(seconds), "sec"],
  ];

  return (
    <div
      className={`flex items-end justify-center gap-3 sm:gap-5 ${
        elapsed ? "text-amber-300" : "text-white"
      }`}
      role="timer"
      aria-live="off"
      aria-label={
        elapsed
          ? "Event in progress"
          : `${days} days ${hours} hours ${minutes} minutes until the next event`
      }
    >
      {units.map(([value, label], index) => (
        <div key={label} className="flex items-end gap-3 sm:gap-5">
          {index > 0 && (
            <span
              aria-hidden
              className="pb-5 text-3xl font-light text-white/25 sm:text-5xl"
            >
              :
            </span>
          )}
          <div className="flex flex-col items-center">
            <span
              className={`font-mono tabular-nums tracking-tighter ${
                compact
                  ? "text-4xl sm:text-6xl"
                  : "text-5xl sm:text-7xl md:text-8xl"
              }`}
            >
              {value}
            </span>
            <span className="mt-1 text-[0.65rem] font-medium uppercase tracking-[0.25em] text-white/40 sm:text-xs">
              {label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
