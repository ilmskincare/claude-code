/** A design image, either a whole upload or a hotspot crop of a flash sheet (percent coordinates). */
export function DesignImage({ src, alt, hotspot, className = "" }: { src: string; alt: string; hotspot?: { x: number | null; y: number | null; w: number | null; h: number | null } | null; className?: string }) {
  if (hotspot && hotspot.x != null && hotspot.y != null && hotspot.w && hotspot.h) {
    const { x, y, w, h } = hotspot;
    const posX = w >= 100 ? 0 : (x / (100 - w)) * 100, posY = h >= 100 ? 0 : (y / (100 - h)) * 100;
    return <div role="img" aria-label={alt} className={`bg-steel ${className}`} style={{ backgroundImage: `url("${src}")`, backgroundSize: `${(100 / w) * 100}% ${(100 / h) * 100}%`, backgroundPosition: `${posX}% ${posY}%`, backgroundRepeat: "no-repeat" }} />;
  }
  // eslint-disable-next-line @next/next/no-img-element -- signed, short-lived URL
  return <img src={src} alt={alt} className={`object-cover bg-steel ${className}`} />;
}
