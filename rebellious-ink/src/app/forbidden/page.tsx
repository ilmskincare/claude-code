import Link from "next/link";
export default function Forbidden() {
  return <div className="flex-1 grid place-items-center p-8"><div className="card p-6 max-w-md"><h1 className="text-2xl font-bold">Not available to your role</h1><p className="mt-2">Your account does not have permission for that area. If you think it should, ask the studio owner to review your access.</p><Link href="/after-login" className="btn btn-primary mt-4">Go to my workspace</Link></div></div>;
}
