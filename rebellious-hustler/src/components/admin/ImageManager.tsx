"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProductImageAction, moveProductImageAction, updateImageAltAction, uploadProductImageAction } from "@/app/admin/actions";

export type ManagedImage = { id: string; url: string; thumbUrl: string; alt: string; isPlaceholder: boolean };

export function ImageManager({ productId, images }: { productId: string; images: ManagedImage[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function upload(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) {
      setMessage({ ok: false, text: "Drop image files only." });
      return;
    }
    const fd = new FormData();
    list.forEach((f) => fd.append("files", f));
    setMessage(null);
    startTransition(async () => {
      const result = await uploadProductImageAction(productId, fd);
      setMessage({ ok: result.ok, text: result.message ?? "" });
      if (result.ok) router.refresh();
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div className="space-y-4">
      <div
        className={`dropzone ${dragging ? "active" : ""}`}
        onDragOver={(ev) => { ev.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(ev) => { ev.preventDefault(); setDragging(false); upload(ev.dataTransfer.files); }}
      >
        <p className="text-sm">{pending ? "Uploading and resizing" : "Drag photos here"}</p>
        <p className="hint my-2 text-xs">or</p>
        <label className="btn btn-secondary btn-sm cursor-pointer">
          Choose files
          <input ref={inputRef} type="file" accept="image/*" multiple className="sr-only" onChange={(ev) => ev.target.files && upload(ev.target.files)} disabled={pending} />
        </label>
      </div>
      {message && <p role={message.ok ? "status" : "alert"} className={message.ok ? "text-sm text-ok" : "error"}>{message.text}</p>}

      {images.length === 0 ? (
        <p className="hint text-sm">No photos yet.</p>
      ) : (
        <ul className="space-y-3">
          {images.map((img, i) => (
            <li key={img.id} className="card-2 flex gap-3 p-3">
              <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded bg-surface">
                <Image src={img.thumbUrl} alt={img.alt} fill sizes="80px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-xs text-muted">{i === 0 ? "Main photo" : `Photo ${i + 1}`}{img.isPlaceholder ? " (placeholder art)" : ""}</p>
                <form action={updateImageAltAction} className="flex gap-2">
                  <input type="hidden" name="imageId" value={img.id} />
                  <label htmlFor={`alt-${img.id}`} className="sr-only">Alt text</label>
                  <input id={`alt-${img.id}`} name="alt" defaultValue={img.alt} placeholder="Describe the photo" className="input py-1 text-sm" style={{ minHeight: "2.2rem" }} maxLength={160} />
                  <button type="submit" className="btn btn-ghost btn-sm">Save</button>
                </form>
                <div className="flex flex-wrap gap-1">
                  <form action={moveProductImageAction}><input type="hidden" name="imageId" value={img.id} /><input type="hidden" name="direction" value="up" /><button type="submit" className="btn btn-ghost btn-sm" disabled={i === 0} aria-label={`Move photo ${i + 1} up`}>Up</button></form>
                  <form action={moveProductImageAction}><input type="hidden" name="imageId" value={img.id} /><input type="hidden" name="direction" value="down" /><button type="submit" className="btn btn-ghost btn-sm" disabled={i === images.length - 1} aria-label={`Move photo ${i + 1} down`}>Down</button></form>
                  <form action={deleteProductImageAction}><input type="hidden" name="imageId" value={img.id} /><button type="submit" className="btn btn-ghost btn-sm text-danger" aria-label={`Delete photo ${i + 1}`}>Delete</button></form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
