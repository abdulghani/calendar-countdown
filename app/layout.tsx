import { NavLink, Outlet } from "react-router";

import { useCalendar } from "~/lib/calendar-store";

export default function AppLayout() {
  const { status, account, refresh, disconnect, lastSyncedAt } = useCalendar();
  const connected = status === "ready" || status === "loading";

  return (
    <div className="relative min-h-dvh overflow-hidden bg-gray-950 text-white">
      {/* Ambient background wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_40rem_at_50%_-10rem,rgba(56,189,248,0.18),transparent),radial-gradient(40rem_30rem_at_90%_110%,rgba(129,140,248,0.16),transparent)]"
      />

      <div className="relative mx-auto flex min-h-dvh max-w-3xl flex-col px-5 pb-12 pt-6">
        <header className="flex items-center justify-between gap-4">
          <nav className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 text-sm">
            <NavItem to="/">Countdown</NavItem>
            <NavItem to="/events">Upcoming</NavItem>
          </nav>

          {connected && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void refresh()}
                disabled={status === "loading"}
                title={
                  lastSyncedAt
                    ? `Last synced ${lastSyncedAt.toLocaleTimeString()}`
                    : undefined
                }
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                {status === "loading" ? "Syncing…" : "Sync"}
              </button>
              <button
                type="button"
                onClick={disconnect}
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                Disconnect
              </button>
            </div>
          )}
        </header>

        <main className="flex flex-1 flex-col justify-center py-10">
          <Outlet />
        </main>

        <footer className="text-center text-xs text-white/25">
          {account ? `Signed in as ${account}` : "Read-only Google Calendar access"}
        </footer>
      </div>
    </div>
  );
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `rounded-full px-4 py-1.5 transition ${
          isActive
            ? "bg-white text-gray-900"
            : "text-white/60 hover:text-white"
        }`
      }
    >
      {children}
    </NavLink>
  );
}
