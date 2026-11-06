"use client";
import { useActionState } from "react";
import { requestMagicLink } from "@/app/actions/auth";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(requestMagicLink, undefined);
  return (
    <form action={action} className="mt-5 space-y-4">
      {state?.error && <p role="alert" className="text-danger">{state.error}</p>}
      <div><label className="field" htmlFor="email">Email address</label><input id="email" name="email" type="email" className="input" required autoComplete="email" autoFocus /></div>
      {next && <input type="hidden" name="next" value={next} />}
      <button className="btn btn-primary w-full justify-center" disabled={pending}>{pending ? "Sending…" : "Email me a sign-in link"}</button>
    </form>
  );
}
