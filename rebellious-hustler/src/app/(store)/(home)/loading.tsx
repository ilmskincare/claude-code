export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12" role="status" aria-live="polite">
      <p className="sr-only">Loading</p>
      <div className="h-16 w-72 animate-pulse rounded bg-surface-2" />
      <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card h-28 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
