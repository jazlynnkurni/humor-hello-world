/** Shown the instant a nav click lands, before the page's data arrives. Paper, nothing else moving. */
export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-6 pt-32 md:px-16" aria-busy>
      <div className="h-4 w-16 rounded-full bg-[color:var(--ink-06)]" />
      <div className="mt-6 h-10 w-64 rounded-full bg-[color:var(--ink-06)]" />
      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="card h-56 opacity-60" />
        ))}
      </div>
    </main>
  );
}
