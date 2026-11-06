import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="script mt-2 text-5xl">Not this one</h1>
      <p className="mt-4 text-muted">That page is not here. It may have moved or sold out.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="btn btn-primary">Back to the shop</Link>
        <Link href="/" className="btn btn-secondary">Home</Link>
      </div>
    </main>
  );
}
