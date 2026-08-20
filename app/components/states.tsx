export function LoadingState({ label = "Loading your calendar…" }) {
  return (
    <div className="flex flex-col items-center gap-4 text-white/40">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-white/70" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="mx-auto max-w-md rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-center"
    >
      <p className="text-sm text-rose-200">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-full border border-white/15 px-4 py-1.5 text-sm text-white/80 hover:bg-white/10"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="text-center">
      <p className="text-4xl">🎉</p>
      <p className="mt-4 text-lg font-medium text-white">{title}</p>
      {hint && <p className="mt-2 text-sm text-white/40">{hint}</p>}
    </div>
  );
}
