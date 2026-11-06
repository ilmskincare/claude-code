export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8" role="status" aria-live="polite">
      <p className="sr-only">Loading products</p>
      <div className="h-8 w-48 animate-pulse rounded bg-surface-2" />
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card overflow-hidden">
            <div className="aspect-product animate-pulse bg-surface-2" />
            <div className="space-y-2 p-4">
              <div className="h-3 w-1/2 animate-pulse rounded bg-surface-2" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-surface-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
