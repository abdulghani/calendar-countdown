import { useCalendar } from "~/lib/calendar-store";

export function ConnectPanel() {
  const { connect, status, error, configured } = useCalendar();
  const busy = status === "connecting" || status === "loading";

  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-3xl shadow-lg shadow-indigo-900/40">
        📅
      </div>
      <h1 className="text-2xl font-semibold text-white">
        Countdown to your next event
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-white/50">
        Connect Google Calendar to see a live countdown to whatever is coming up
        next. Read-only access; the token stays in this browser tab.
      </p>

      {!configured ? (
        <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-left text-sm text-amber-200">
          <p className="font-medium">Google client ID not set</p>
          <p className="mt-1 text-amber-200/70">
            Copy <code className="font-mono">.env.example</code> to{" "}
            <code className="font-mono">.env</code>, set{" "}
            <code className="font-mono">VITE_GOOGLE_CLIENT_ID</code>, then
            restart the dev server. See the README for the Cloud Console steps.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => void connect()}
          disabled={busy}
          className="mt-6 inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-medium text-gray-900 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <GoogleMark />
          {busy ? "Connecting…" : "Connect Google Calendar"}
        </button>
      )}

      {error && (
        <p className="mt-4 text-sm text-rose-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.5 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.4 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.4a12 12 0 0 0 0 10.8l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z"
      />
    </svg>
  );
}
