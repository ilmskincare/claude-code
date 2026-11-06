"use client";

import { useActionState } from "react";
import { startCheckoutAction, type ActionState } from "@/app/(store)/actions";
import { formatPence } from "@/lib/money";
import type { ShippingOption } from "@/lib/cart-math";

export function CheckoutButton({ options, disabled }: { options: ShippingOption[]; disabled: boolean }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(startCheckoutAction, null);
  return (
    <form action={formAction} className="space-y-4">
      <fieldset>
        <legend className="field"><span>Delivery</span></legend>
        <div className="space-y-2">
          {options.map((o, i) => (
            <label key={o.id} className="card-2 flex cursor-pointer items-center justify-between gap-3 p-3 text-sm">
              <span className="flex items-center gap-3">
                <input type="radio" name="shipping" value={o.id} defaultChecked={i === 0} className="h-4 w-4 accent-[#d61f2c]" />
                <span>
                  <span className="font-semibold">{o.name}</span>
                  <span className="hint block">{o.estimate}</span>
                </span>
              </span>
              <span className="font-bold">{o.pence === 0 ? "Free" : formatPence(o.pence)}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <button type="submit" className="btn btn-primary w-full" disabled={disabled || pending}>
        {pending ? "Taking you to secure checkout" : "Checkout securely"}
      </button>
      <p className="hint text-center text-xs">Card payments are handled by Stripe. We never see your card details.</p>
      {state?.message && <p role="alert" className="text-sm text-danger">{state.message}</p>}
    </form>
  );
}
