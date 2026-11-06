"use client";
import { useActionState } from "react";
import { changePasswordAction } from "@/app/actions/staff-auth";

export function PasswordForm({ needsCurrent }: { needsCurrent: boolean }) {
  const [state, action, pending] = useActionState(changePasswordAction, undefined);
  return (
    <form action={action} className="mt-5 space-y-4">
      {state?.error && <p role="alert" className="text-danger">{state.error}</p>}
      {needsCurrent && <div><label className="field" htmlFor="current">Current password</label><input id="current" name="current" type="password" className="input" required autoComplete="current-password" /></div>}
      <div><label className="field" htmlFor="password">New password</label><input id="password" name="password" type="password" className="input" required minLength={10} autoComplete="new-password" /></div>
      <div><label className="field" htmlFor="confirm">New password again</label><input id="confirm" name="confirm" type="password" className="input" required minLength={10} autoComplete="new-password" /></div>
      <button className="btn btn-primary w-full justify-center" disabled={pending}>{pending ? "Saving…" : "Save password"}</button>
    </form>
  );
}
