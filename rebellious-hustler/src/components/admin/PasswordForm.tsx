"use client";

import { useActionState } from "react";
import { changePasswordAction, type FormState } from "@/app/admin/actions";

function Field({ id, label, error, autoComplete }: { id: string; label: string; error?: string; autoComplete: string }) {
  return (
    <div>
      <label htmlFor={id} className="field">{label}</label>
      <input id={id} name={id} type="password" autoComplete={autoComplete} required className="input" aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />
      {error && <p id={`${id}-error`} className="error mt-1">{error}</p>}
    </div>
  );
}

export function PasswordForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(changePasswordAction, null);
  return (
    <form action={formAction} className="space-y-4" noValidate>
      <Field id="current" label="Current password" autoComplete="current-password" error={state?.errors?.current} />
      <Field id="next" label="New password" autoComplete="new-password" error={state?.errors?.next} />
      <Field id="confirm" label="New password again" autoComplete="new-password" error={state?.errors?.confirm} />
      {state?.message && <p role="alert" className="error">{state.message}</p>}
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>{pending ? "Saving" : "Save new password"}</button>
    </form>
  );
}
