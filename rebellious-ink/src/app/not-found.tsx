import Link from "next/link";
export default function NotFound() {
  return <div className="flex-1 grid place-items-center p-8"><div className="card p-6 max-w-md"><h1 className="text-2xl font-bold">Not found</h1><p className="mt-2">That page or record does not exist, or is not available to you.</p><Link href="/" className="btn btn-primary mt-4">Home</Link></div></div>;
}
