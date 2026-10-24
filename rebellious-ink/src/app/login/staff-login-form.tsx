"use client";
import { useActionState, useState } from "react";
import { staffSignInAction } from "@/app/actions/staff-auth";

export function StaffLoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(staffSignInAction, undefined);
  const [username, setUsername] = useState("");   // kept across a failed attempt so only the password needs retyping
  return (
    <form action={action} className="mt-5 space-y-4">
      {state?.error && <p role="alert" className="text-danger">{state.error}</p>}
      <div><label className="field" htmlFor="username">Username</label><input id="username" name="username" className="input" required autoComplete="username" autoCapitalize="none" spellCheck={false} value={username} onChange={(e) => setUsername(e.target.value)} /></div>
      <div><label className="field" htmlFor="password">Password</label><input id="password" name="password" type="password" className="input" required autoComplete="current-password" /></div>
      {next && <input type="hidden" name="next" value={next} />}
      <button className="btn btn-primary w-full justify-center" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
      <p className="hint">Forgotten it? Ask the owner or the desk to reset it; they will give you a one-time password.</p>
    </form>
  );
}
