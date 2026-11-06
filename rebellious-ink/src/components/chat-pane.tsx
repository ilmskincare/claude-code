/* eslint-disable @next/next/no-img-element -- attachments are served through short-lived signed URLs */
"use client";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { sendChatAction } from "@/app/actions/chat";

export type ChatMsg = { id: string; body: string; attachments?: string[]; createdAt: string; senderId: string; senderName: string; mine: boolean };

const dayLabel = (iso: string) => { const d = new Date(iso); const t = new Date(); const y = new Date(t); y.setDate(t.getDate() - 1); const same = (a: Date, b: Date) => a.toDateString() === b.toDateString(); return same(d, t) ? "Today" : same(d, y) ? "Yesterday" : d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }); };
const time = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

/** WhatsApp-style thread: own messages on the right in acid green, others on the left; polls every few seconds. */
export function ChatPane({ channelId, title, members, kind, initial, clientView }: { channelId: string; title: string; members: string[]; kind: "STUDIO" | "MANAGEMENT" | "DIRECT" | "CLIENT"; initial: ChatMsg[]; clientView?: boolean }) {
  const [messages, setMessages] = useState<ChatMsg[]>(initial);
  const [state, action, pending] = useActionState(sendChatAction, undefined);
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState(0);
  const bottom = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const lastSent = useRef<string | undefined>(undefined);

  const pull = useCallback(async () => {
    const after = messages[messages.length - 1]?.createdAt;
    const r = await fetch(`/api/chat/${channelId}${after ? `?after=${encodeURIComponent(after)}` : ""}`, { cache: "no-store" }).catch(() => null);
    if (!r?.ok) return;
    const j = (await r.json()) as { messages: ChatMsg[] };
    if (j.messages.length) setMessages((cur) => { const seen = new Set(cur.map((m) => m.id)); return [...cur, ...j.messages.filter((m) => !seen.has(m.id))]; });
  }, [channelId, messages]);
  useEffect(() => { const t = setInterval(() => { void pull(); }, 6000); return () => clearInterval(t); }, [pull]);
  useEffect(() => {
    if (state?.ok && state.sentId !== lastSent.current) { lastSent.current = state.sentId; setDraft(""); setFiles(0); formRef.current?.reset(); void pull(); }
  }, [state, pull]);
  useEffect(() => { bottom.current?.scrollIntoView({ block: "end" }); }, [messages.length]);

  return (
    <section className="card flex flex-col h-[70vh] min-h-[420px]">
      <header className="px-4 py-3 border-b border-graphite"><h2 className="font-bold">{title}</h2><p className="text-xs opacity-70">{kind === "STUDIO" ? "Everyone on the team. Visible to the studio owners. Keep client details out of here; use the enquiry thread for those." : kind === "MANAGEMENT" ? "Owners and managers only." : kind === "CLIENT" ? (clientView ? "Your private chat with the artist. The studio desk and owners can see it too, so they can help if needed. You can attach photos." : `Client chat with ${members.join(" and ")}. Visible to the studio owners. Photos welcome; keep health details for the consent form.`) : `${members.join(" and ")}. Visible to the studio owners. Keep client details out of here; use the enquiry thread for those.`}</p></header>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.length === 0 && <p className="text-sm opacity-60 text-center mt-8">No messages yet. Say hello.</p>}
        {messages.map((m, i) => {
          const day = dayLabel(m.createdAt); const sep = i === 0 || day !== dayLabel(messages[i - 1].createdAt);
          return (
            <div key={m.id}>
              {sep && <p className="text-center text-xs opacity-60 my-2"><span className="px-2 py-0.5 rounded-full bg-steel">{day}</span></p>}
              <div className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.mine ? "bg-acid text-ink rounded-br-sm" : "bg-steel text-bone rounded-bl-sm"}`}>
                  {!m.mine && kind !== "DIRECT" && kind !== "CLIENT" && <p className="text-xs font-bold opacity-80">{m.senderName}</p>}
                  {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                  {m.attachments && m.attachments.length > 0 && <div className="mt-1 grid grid-cols-2 gap-1">{m.attachments.map((u, k) => <a key={k} href={u} target="_blank" rel="noopener noreferrer"><img src={u} alt="Attached photo" className="rounded-lg object-cover w-full aspect-square" /></a>)}</div>}
                  <p className={`text-[10px] mt-1 ${m.mine ? "text-ink/70" : "opacity-60"} text-right`}>{time(m.createdAt)}</p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
      <form ref={formRef} action={action} encType="multipart/form-data" className="border-t border-graphite p-3 flex gap-2 items-end flex-wrap">
        <input type="hidden" name="channelId" value={channelId} />
        <label className="sr-only" htmlFor={`chat-${channelId}`}>Message</label>
        <textarea id={`chat-${channelId}`} name="body" className="textarea flex-1" rows={2} maxLength={2000} placeholder="Type a message. Enter sends, Shift+Enter for a new line." value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (draft.trim()) formRef.current?.requestSubmit(); } }} />
        <label className="btn btn-secondary cursor-pointer" title="Attach photos"><span aria-hidden="true">📷</span><span className="sr-only">Attach photos</span><input type="file" name="photos" accept="image/*" multiple className="sr-only" onChange={(e) => setFiles(e.target.files?.length ?? 0)} /></label>
        <button className="btn btn-primary" disabled={pending || (!draft.trim() && files === 0)}>{pending ? "…" : "Send"}</button>
        {files > 0 && <p className="w-full text-xs opacity-70">{files} photo{files === 1 ? "" : "s"} attached</p>}
      </form>
      {state?.error && <p className="px-4 pb-2 text-sm text-danger" role="alert">{state.error}</p>}
    </section>
  );
}
