"use client";

import { useActionState } from "react";
import { loginAction, type FormState } from "@/app/admin/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(loginAction, null);
  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div>
        <label htmlFor="username" className="field">Username</label>
        <input id="username" name="username" type="text" autoComplete="username" required className="input" aria-invalid={Boolean(state?.errors?.username)} aria-describedby={state?.errors?.username ? "username-error" : undefined} />
        {state?.errors?.username && <p id="username-error" className="error mt-1">{state.errors.username}</p>}
      </div>
      <div>
        <label htmlFor="password" className="field">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" aria-invalid={Boolean(state?.errors?.password)} aria-describedby={state?.errors?.password ? "password-error" : undefined} />
        {state?.errors?.password && <p id="password-error" className="error mt-1">{state.errors.password}</p>}
      </div>
      {state?.message && <p role="alert" className="error">{state.message}</p>}
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>{pending ? "Signing in" : "Sign in"}</button>
    </form>
  );
}
