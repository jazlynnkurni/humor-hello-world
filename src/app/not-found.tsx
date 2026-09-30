import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="eyebrow">404</p>
      <h1 className="t-h2">That page didn&apos;t make the list.</h1>
      <Link href="/jokes" className="btn btn-ink mt-2">
        See the jokes
      </Link>
    </main>
  );
}
