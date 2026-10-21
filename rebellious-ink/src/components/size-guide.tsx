/** Small (6 cm) and Palm (12 cm) drawn to scale against a forearm, so "small" means the same thing to everyone. */
export function SizeGuide({ smallCm, palmCm, chosen }: { smallCm: number; palmCm: number | null; chosen: "small" | "palm" }) {
  const cmToPx = 9; // forearm drawn at roughly 26 cm long
  const small = smallCm * cmToPx, palm = (palmCm ?? 0) * cmToPx;
  return (
    <figure className="card p-4">
      <svg viewBox="0 0 320 150" className="w-full h-auto" role="img" aria-label={palmCm ? `Size guide: small up to ${smallCm} cm, palm up to ${palmCm} cm, shown on a forearm` : `Size guide: up to ${smallCm} cm, shown on a forearm`}>
        <path d="M14 95 C 40 60, 120 50, 190 58 C 250 64, 290 72, 306 80 L 306 118 C 290 126, 250 132, 190 130 C 120 128, 40 118, 14 112 Z" fill="var(--graphite)" stroke="var(--bone)" strokeOpacity=".4" />
        <text x="18" y="140" fontSize="9" fill="currentColor" opacity=".6">wrist</text>
        <text x="282" y="140" fontSize="9" fill="currentColor" opacity=".6">elbow</text>
        <rect x={60} y={94 - small / 2} width={small} height={small} rx="4" fill={chosen === "small" ? "var(--acid)" : "none"} stroke="var(--acid)" strokeWidth="2" />
        <text x={60 + small / 2} y={94 + small / 2 + 12} fontSize="9" textAnchor="middle" fill="currentColor">{palmCm ? "Small " : "Up to "}{smallCm} cm</text>
        {palmCm && <rect x={150} y={94 - (palm * 0.6) / 2} width={palm} height={palm * 0.6} rx="4" fill={chosen === "palm" ? "var(--acid)" : "none"} fillOpacity={chosen === "palm" ? ".9" : "1"} stroke="var(--acid)" strokeWidth="2" strokeDasharray={chosen === "palm" ? "0" : "4 3"} />}
        {palmCm && <text x={150 + palm / 2} y={94 + (palm * 0.6) / 2 + 12} fontSize="9" textAnchor="middle" fill="currentColor">Palm {palmCm} cm</text>}
      </svg>
      <figcaption className="hint mt-1">Size is the longest edge, drawn to scale on a forearm. Your artist confirms the final size at the appointment.</figcaption>
    </figure>
  );
}
