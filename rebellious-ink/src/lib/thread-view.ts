import { signedUrl } from "./storage";
import type { ThreadAttachment } from "@/components/thread";

type Msg = { id: string; body: string; visibility: string; createdAt: Date; sender: { id: string; name: string | null }; attachments: { id: string; storageKey: string; originalName: string; mimeType: string; scanStatus: string }[] };

/** Serialise thread messages for the client component, minting short-lived signed links for attachments. */
export function threadMessages(messages: Msg[]) {
  return messages.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
    attachments: m.attachments.filter((a) => a.scanStatus !== "FLAGGED").map<ThreadAttachment>((a) => ({ id: a.id, url: signedUrl(a.storageKey, 900), name: a.originalName, mimeType: a.mimeType })),
  }));
}
