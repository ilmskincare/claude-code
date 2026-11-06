"use client";

import Image from "next/image";
import { useState } from "react";

export type GalleryImage = { id: string; url: string; thumbUrl: string; alt: string };

export function Gallery({ images, name }: { images: GalleryImage[]; name: string }) {
  const [index, setIndex] = useState(0);
  if (images.length === 0) {
    return <div className="aspect-product card flex items-center justify-center text-muted">Photos coming soon</div>;
  }
  const current = images[Math.min(index, images.length - 1)];
  return (
    <div>
      <div className="aspect-product card relative overflow-hidden bg-surface-2">
        <Image key={current.id} src={current.url} alt={current.alt || name} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" priority />
      </div>
      {images.length > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto" aria-label="More photos">
          {images.map((img, i) => (
            <li key={img.id} className="shrink-0">
              <button type="button" onClick={() => setIndex(i)} aria-label={`Photo ${i + 1} of ${images.length}`} aria-pressed={i === index} className={`relative block h-20 w-16 overflow-hidden rounded-md border-2 ${i === index ? "border-gold" : "border-border"}`}>
                <Image src={img.thumbUrl} alt="" fill sizes="64px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
