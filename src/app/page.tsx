import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-5xl font-semibold tracking-tight">Hello World</h1>
      <Link
        href="/jokes"
        className="rounded-full border border-neutral-700 px-5 py-2 text-sm hover:bg-neutral-900"
      >
        See the jokes →
      </Link>
    </main>
  );
}
