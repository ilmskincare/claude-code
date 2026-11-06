"use client";

import { useActionState, useState } from "react";
import { saveProductAction, type FormState } from "@/app/admin/actions";
import { AUDIENCE_LABEL, CATEGORY_LABEL, slugify } from "@/lib/catalogue";
import { penceToPoundsInput } from "@/lib/money";
import type { Audience, Category } from "@/generated/prisma/enums";

export type VariantRow = { id?: string; size: string; colour: string; sku: string; stockQty: number };

export type ProductFormData = {
  id: string;
  name: string;
  slug: string;
  description: string;
  audience: Audience;
  category: Category;
  pricePence: number;
  compareAtPence: number | null;
  featured: boolean;
  variants: VariantRow[];
};

const ADULT = "XS, S, M, L, XL, 2XL, 3XL";
const KIDS = "3-4, 5-6, 7-8, 9-10, 11-12, 13-14";

function skuFor(prefix: string, colour: string, size: string) {
  const c = colour.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || "COL";
  const s = size.replace(/[^A-Za-z0-9]/g, "").toUpperCase() || "OS";
  return `${prefix}-${c}-${s}`;
}

export function ProductForm({ product }: { product: ProductFormData | null }) {
  const action = saveProductAction.bind(null, product?.id ?? null);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null);
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [rows, setRows] = useState<VariantRow[]>(product?.variants ?? []);
  const [sizes, setSizes] = useState(ADULT);
  const [colours, setColours] = useState("Black");
  const [prefix, setPrefix] = useState("RH");
  const e = state?.errors ?? {};

  function onName(v: string) {
    setName(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  function generate() {
    const sizeList = sizes.split(",").map((s) => s.trim()).filter(Boolean);
    const colourList = colours.split(",").map((s) => s.trim()).filter(Boolean);
    const next = [...rows];
    for (const colour of colourList) {
      for (const size of sizeList) {
        if (!next.some((r) => r.size.toLowerCase() === size.toLowerCase() && r.colour.toLowerCase() === colour.toLowerCase())) {
          next.push({ size, colour, sku: skuFor(prefix.trim().toUpperCase() || "RH", colour, size), stockQty: 0 });
        }
      }
    }
    setRows(next);
  }

  function update(i: number, patch: Partial<VariantRow>) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state?.message && (
        <p role={state.ok ? "status" : "alert"} className={state.ok ? "text-sm text-ok" : "error"}>{state.message}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className="field">Name</label>
          <input id="name" name="name" className="input" required value={name} onChange={(ev) => onName(ev.target.value)} aria-invalid={Boolean(e.name)} aria-describedby={e.name ? "name-error" : undefined} />
          {e.name && <p id="name-error" className="error mt-1">{e.name}</p>}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="slug" className="field">Web address (slug)</label>
          <div className="flex items-center gap-2">
            <span className="hint">/shop/</span>
            <input id="slug" name="slug" className="input" required value={slug} onChange={(ev) => { setSlugTouched(true); setSlug(ev.target.value); }} aria-invalid={Boolean(e.slug)} aria-describedby={e.slug ? "slug-error" : "slug-hint"} />
          </div>
          <p id="slug-hint" className="hint mt-1 text-xs">Lower-case letters, numbers and hyphens. Changing it on a live product changes its link.</p>
          {e.slug && <p id="slug-error" className="error mt-1">{e.slug}</p>}
        </div>
        <div>
          <label htmlFor="audience" className="field">Range</label>
          <select id="audience" name="audience" className="select" defaultValue={product?.audience ?? "MENS"}>
            {(Object.keys(AUDIENCE_LABEL) as Audience[]).map((a) => <option key={a} value={a}>{AUDIENCE_LABEL[a]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="category" className="field">Category</label>
          <select id="category" name="category" className="select" defaultValue={product?.category ?? "T_SHIRTS"}>
            {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="price" className="field">Price (pounds)</label>
          <input id="price" name="price" inputMode="decimal" className="input" placeholder="24.99" required defaultValue={product ? penceToPoundsInput(product.pricePence) : ""} aria-invalid={Boolean(e.price)} aria-describedby={e.price ? "price-error" : undefined} />
          {e.price && <p id="price-error" className="error mt-1">{e.price}</p>}
        </div>
        <div>
          <label htmlFor="compareAt" className="field">Was price (optional)</label>
          <input id="compareAt" name="compareAt" inputMode="decimal" className="input" placeholder="29.99" defaultValue={penceToPoundsInput(product?.compareAtPence)} aria-invalid={Boolean(e.compareAt)} aria-describedby={e.compareAt ? "compareAt-error" : "compareAt-hint"} />
          <p id="compareAt-hint" className="hint mt-1 text-xs">Shows crossed out next to the price when it is higher.</p>
          {e.compareAt && <p id="compareAt-error" className="error mt-1">{e.compareAt}</p>}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="description" className="field">Description</label>
          <textarea id="description" name="description" className="textarea" rows={6} defaultValue={product?.description ?? ""} aria-describedby="description-hint" />
          <p id="description-hint" className="hint mt-1 text-xs">Plain text. Leave a blank line between paragraphs.</p>
        </div>
        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="featured" defaultChecked={product?.featured ?? false} className="h-4 w-4 accent-[#19c8ff]" />
            Featured on the home page
          </label>
        </div>
      </div>

      <fieldset className="card p-4">
        <legend className="field"><span>Sizes, colours and stock</span></legend>
        <p className="hint text-sm">Each row is one size and colour with its own SKU and stock count. Generate a grid, then adjust.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
          <div>
            <label htmlFor="gen-sizes" className="field text-xs">Sizes (comma separated)</label>
            <input id="gen-sizes" className="input" value={sizes} onChange={(ev) => setSizes(ev.target.value)} />
            <div className="mt-1 flex gap-2 text-xs">
              <button type="button" className="text-accent underline" onClick={() => setSizes(ADULT)}>Adult</button>
              <button type="button" className="text-accent underline" onClick={() => setSizes(KIDS)}>Kids</button>
              <button type="button" className="text-accent underline" onClick={() => setSizes("One size")}>One size</button>
            </div>
          </div>
          <div>
            <label htmlFor="gen-colours" className="field text-xs">Colours (comma separated)</label>
            <input id="gen-colours" className="input" value={colours} onChange={(ev) => setColours(ev.target.value)} />
          </div>
          <div>
            <label htmlFor="gen-prefix" className="field text-xs">SKU prefix</label>
            <input id="gen-prefix" className="input w-28" value={prefix} onChange={(ev) => setPrefix(ev.target.value)} />
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={generate}>Generate grid</button>
        </div>

        {e.variants && <p className="error mt-3">{e.variants}</p>}
        {rows.length > 0 && (
          <div className="table-wrap mt-4">
            <table className="data variants">
              <thead><tr><th scope="col">Size</th><th scope="col">Colour</th><th scope="col">SKU</th><th scope="col">Stock</th><th scope="col"><span className="sr-only">Remove</span></th></tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id ?? `${i}-${r.sku}`}>
                    <td><label className="sr-only" htmlFor={`size-${i}`}>Size</label><input id={`size-${i}`} className="input py-1" style={{ minHeight: "2.4rem", width: "6rem", minWidth: "6rem" }} value={r.size} onChange={(ev) => update(i, { size: ev.target.value })} aria-invalid={Boolean(e[`variants.${i}.size`])} /></td>
                    <td><label className="sr-only" htmlFor={`colour-${i}`}>Colour</label><input id={`colour-${i}`} className="input py-1" style={{ minHeight: "2.4rem", width: "7.5rem", minWidth: "7.5rem" }} value={r.colour} onChange={(ev) => update(i, { colour: ev.target.value })} aria-invalid={Boolean(e[`variants.${i}.colour`])} /></td>
                    <td><label className="sr-only" htmlFor={`sku-${i}`}>SKU</label><input id={`sku-${i}`} className="input py-1 font-mono text-sm" style={{ minHeight: "2.4rem", width: "11rem", minWidth: "11rem" }} value={r.sku} onChange={(ev) => update(i, { sku: ev.target.value })} aria-invalid={Boolean(e[`variants.${i}.sku`])} /></td>
                    <td><label className="sr-only" htmlFor={`stock-${i}`}>Stock</label><input id={`stock-${i}`} type="number" min={0} className="input py-1" style={{ minHeight: "2.4rem", width: "5.5rem", minWidth: "5.5rem" }} value={r.stockQty} onChange={(ev) => update(i, { stockQty: Number(ev.target.value) })} /></td>
                    <td><button type="button" className="btn btn-ghost btn-sm" onClick={() => setRows((x) => x.filter((_, idx) => idx !== i))} aria-label={`Remove ${r.size} ${r.colour}`}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {Object.entries(e).filter(([k]) => k.startsWith("variants.")).slice(0, 3).map(([k, v]) => <p key={k} className="error mt-2">{v}</p>)}
          </div>
        )}
        <button type="button" className="btn btn-ghost btn-sm mt-3" onClick={() => setRows((x) => [...x, { size: "", colour: "", sku: "", stockQty: 0 }])}>Add a row</button>
        <input type="hidden" name="variantsJson" value={JSON.stringify(rows)} />
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Saving" : product ? "Save changes" : "Create draft"}</button>
      </div>
    </form>
  );
}
