"use client";

import { useActionState } from "react";
import { saveSettingsAction, type FormState } from "@/app/admin/actions";
import { penceToPoundsInput } from "@/lib/money";
import type { Settings } from "@/lib/settings";

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="field">{label}</label>
      {children}
      {hint && !error && <p className="hint mt-1 text-xs">{hint}</p>}
      {error && <p id={`${id}-error`} className="error mt-1">{error}</p>}
    </div>
  );
}

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(saveSettingsAction, null);
  const e = state?.errors ?? {};
  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state?.message && <p role={state.ok ? "status" : "alert"} className={state.ok ? "text-sm text-ok" : "error"}>{state.message}</p>}

      <fieldset className="space-y-4">
        <legend className="field"><span>Delivery (pounds)</span></legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="shippingStandard" label="UK Standard" error={e.shippingStandard}>
            <input id="shippingStandard" name="shippingStandard" inputMode="decimal" className="input" defaultValue={penceToPoundsInput(settings.shippingStandardPence)} aria-invalid={Boolean(e.shippingStandard)} />
          </Field>
          <Field id="shippingExpress" label="UK Express" error={e.shippingExpress}>
            <input id="shippingExpress" name="shippingExpress" inputMode="decimal" className="input" defaultValue={penceToPoundsInput(settings.shippingExpressPence)} aria-invalid={Boolean(e.shippingExpress)} />
          </Field>
          <Field id="freeShippingThreshold" label="Free delivery over" error={e.freeShippingThreshold} hint="Both services become free at this subtotal.">
            <input id="freeShippingThreshold" name="freeShippingThreshold" inputMode="decimal" className="input" defaultValue={penceToPoundsInput(settings.freeShippingThresholdPence)} aria-invalid={Boolean(e.freeShippingThreshold)} />
          </Field>
        </div>
      </fieldset>

      <Field id="announcement" label="Announcement bar" hint="Shown at the top of every page. Leave blank to hide it." error={e.announcement}>
        <input id="announcement" name="announcement" className="input" maxLength={160} defaultValue={settings.announcement} />
      </Field>
      <Field id="contactEmail" label="Contact email" hint="Shown in the footer and on the contact page." error={e.contactEmail}>
        <input id="contactEmail" name="contactEmail" type="email" className="input" defaultValue={settings.contactEmail} aria-invalid={Boolean(e.contactEmail)} />
      </Field>
      <Field id="instagramHandle" label="Instagram handle" hint="Without the @." error={e.instagramHandle}>
        <input id="instagramHandle" name="instagramHandle" className="input" defaultValue={settings.instagramHandle} aria-invalid={Boolean(e.instagramHandle)} />
      </Field>
      <Field id="storeAddress" label="Shop address" error={e.storeAddress}>
        <textarea id="storeAddress" name="storeAddress" className="textarea" rows={2} defaultValue={settings.storeAddress} />
      </Field>

      <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Saving" : "Save settings"}</button>
    </form>
  );
}
