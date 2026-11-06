"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { addToCartAction, type ActionState } from "@/app/(store)/actions";
import { sortSizes } from "@/lib/catalogue";
import { MAX_LINE_QTY } from "@/lib/site";

export type VariantOption = { id: string; size: string; colour: string; stockQty: number };

/**
 * Colour first, then size. Only combinations with stock are offered; the rest are shown
 * disabled so the customer can see what exists but is sold out.
 */
export function AddToCart({ variants }: { variants: VariantOption[] }) {
  const colours = useMemo(() => Array.from(new Set(variants.map((v) => v.colour))), [variants]);
  const sizes = useMemo(() => sortSizes(Array.from(new Set(variants.map((v) => v.size)))), [variants]);
  const inStockColours = colours.filter((c) => variants.some((v) => v.colour === c && v.stockQty > 0));
  const [colour, setColour] = useState<string>(inStockColours[0] ?? colours[0] ?? "");
  const sizesForColour = sizes.filter((s) => variants.some((v) => v.colour === colour && v.size === s));
  const firstInStock = sizesForColour.find((s) => variants.some((v) => v.colour === colour && v.size === s && v.stockQty > 0));
  const [size, setSize] = useState<string>(firstInStock ?? "");
  const selected = variants.find((v) => v.colour === colour && v.size === size) ?? null;
  const available = selected ? Math.min(selected.stockQty, MAX_LINE_QTY) : 0;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(addToCartAction, null);
  const allSoldOut = variants.every((v) => v.stockQty <= 0);

  function pickColour(c: string) {
    setColour(c);
    const stillOk = variants.some((v) => v.colour === c && v.size === size && v.stockQty > 0);
    if (!stillOk) {
      const next = sortSizes(variants.filter((v) => v.colour === c && v.stockQty > 0).map((v) => v.size))[0] ?? "";
      setSize(next);
    }
  }

  if (allSoldOut) {
    return (
      <div className="card p-4">
        <p className="font-bold">Sold out online</p>
        <p className="hint mt-1">Message us on Instagram and we will check the shop floor.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5" data-testid="add-to-cart">
      <fieldset>
        <legend className="field"><span>Colour{colour ? `: ${colour}` : ""}</span></legend>
        <div className="flex flex-wrap gap-2">
          {colours.map((c) => {
            const any = variants.some((v) => v.colour === c && v.stockQty > 0);
            return (
              <button
                key={c}
                type="button"
                onClick={() => pickColour(c)}
                aria-pressed={colour === c}
                disabled={!any}
                className={`btn btn-sm ${colour === c ? "btn-gold" : "btn-secondary"}`}
                title={any ? c : `${c}: sold out`}
              >
                {c}{!any ? " (sold out)" : ""}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="field"><span>Size{size ? `: ${size}` : ""}</span></legend>
        <div className="flex flex-wrap gap-2">
          {sizesForColour.map((s) => {
            const v = variants.find((x) => x.colour === colour && x.size === s);
            const ok = Boolean(v && v.stockQty > 0);
            return (
              <button
                key={s}
                type="button"
                onClick={() => ok && setSize(s)}
                aria-pressed={size === s}
                disabled={!ok}
                className={`btn btn-sm min-w-[3.2rem] ${size === s ? "btn-gold" : "btn-secondary"}`}
                title={ok ? s : `${s}: sold out`}
              >
                {s}
              </button>
            );
          })}
        </div>
        {selected && selected.stockQty > 0 && selected.stockQty <= 3 && <p className="mt-2 text-sm text-warn">Only {selected.stockQty} left in this size.</p>}
      </fieldset>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="quantity" className="field">Quantity</label>
          <select id="quantity" name="quantity" className="select w-24" defaultValue="1" disabled={!selected}>
            {Array.from({ length: Math.max(1, available) }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <input type="hidden" name="variantId" value={selected?.id ?? ""} />
        <button type="submit" className="btn btn-primary flex-1 sm:flex-none sm:min-w-[12rem]" disabled={!selected || pending}>
          {pending ? "Adding" : "Add to cart"}
        </button>
      </div>

      {state?.message && (
        <p role="status" aria-live="polite" className={state.ok ? "text-sm text-ok" : "text-sm text-danger"}>
          {state.message}{state.ok && <> <Link href="/cart" className="font-semibold text-gold underline">View cart</Link></>}
        </p>
      )}
    </form>
  );
}
