export function AnnouncementBar({ text }: { text: string }) {
  if (!text.trim()) return null;
  return (
    <div className="bg-red text-white">
      <p className="mx-auto max-w-6xl px-4 py-2 text-center text-sm font-semibold tracking-wide">{text}</p>
    </div>
  );
}
