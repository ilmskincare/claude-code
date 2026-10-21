/* eslint-disable @next/next/no-img-element -- evidence photos are short-lived signed URLs */
"use client";
import { useActionState } from "react";
import { logHoursAction, addEvidenceAction, updateSkillAction, verifyHoursAction, commentEvidenceAction, juniorSignoffAction } from "@/app/actions/academy";
import { Alert } from "./ui";

export type SkillRow = { id: string; key: string; title: string; description: string | null; isCore: boolean; progress: { status: string; apprenticeNote: string | null; mentorNote: string | null; signedOffAt: string | null; signedOffByName: string | null } | null };
export type AreaRow = { key: string; label: string; skills: SkillRow[] };
export type LogRow = { id: string; date: string; minutes: number; activity: string; notes: string | null; supervisorName: string | null; verifiedAt: string | null; rejectedNote: string | null };
export type EvidenceRow = { id: string; url: string; caption: string | null; stage: string | null; skillTitle: string | null; mentorComment: string | null; createdAt: string };

const STATUS: Record<string, [string, string]> = { NOT_STARTED: ["Not started", "badge-muted"], IN_PROGRESS: ["In progress", "badge-outline"], READY_FOR_REVIEW: ["Ready for review", "badge-warn"], COMPETENT: ["Competent", "badge-acid"], RENEWAL_DUE: ["Renewal due", "badge-danger"] };
const d = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { timeZone: "Europe/London" });

export function HoursForm({ apprenticeId, supervisors }: { apprenticeId: string; supervisors: { id: string; displayName: string }[] }) {
  const [state, action, pending] = useActionState(logHoursAction, undefined);
  return (
    <form action={action} className="space-y-2">
      {state?.error && <Alert tone="danger">{state.error}</Alert>}{state?.ok && <Alert tone="success">Logged. Your mentor will verify it.</Alert>}
      <input type="hidden" name="apprenticeId" value={apprenticeId} />
      <div className="grid grid-cols-2 gap-2">
        <div><label className="field" htmlFor="date">Date</label><input id="date" name="date" type="date" className="input" required defaultValue={new Date().toISOString().slice(0, 10)} /></div>
        <div><label className="field" htmlFor="hours">Hours</label><input id="hours" name="hours" type="number" step="0.25" min={0.25} max={14} className="input" required /></div>
        <div className="col-span-2"><label className="field" htmlFor="activity">What you did</label><input id="activity" name="activity" className="input" required placeholder="e.g. Practice skin linework, shadowed two consultations" /></div>
        <div><label className="field" htmlFor="supervisorId">Supervised by</label><select id="supervisorId" name="supervisorId" className="select" defaultValue=""><option value="">Not supervised</option>{supervisors.map((s) => <option key={s.id} value={s.id}>{s.displayName}</option>)}</select></div>
        <div><label className="field" htmlFor="notes">Notes (optional)</label><input id="notes" name="notes" className="input" /></div>
      </div>
      <button className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : "Log hours"}</button>
    </form>
  );
}

export function EvidenceForm({ apprenticeId, skills }: { apprenticeId: string; skills: { id: string; title: string }[] }) {
  const [state, action, pending] = useActionState(addEvidenceAction, undefined);
  return (
    <form action={action} className="space-y-2" encType="multipart/form-data">
      {state?.error && <Alert tone="danger">{state.error}</Alert>}{state?.ok && <Alert tone="success">Photos added to your progression record.</Alert>}
      <input type="hidden" name="apprenticeId" value={apprenticeId} />
      <div><label className="field" htmlFor="photos">Photos (up to 10)</label><input id="photos" name="photos" type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic" className="input" capture="environment" required /></div>
      <div className="grid grid-cols-2 gap-2">
        <div><label className="field" htmlFor="stage">What is it</label><select id="stage" name="stage" className="select"><option value="practice_skin">Practice skin</option><option value="supervised_client">Supervised client work</option><option value="design">Design / drawing</option><option value="other">Other</option></select></div>
        <div><label className="field" htmlFor="skillId">Links to skill (optional)</label><select id="skillId" name="skillId" className="select" defaultValue=""><option value="">None</option>{skills.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select></div>
      </div>
      <div><label className="field" htmlFor="caption">Caption</label><input id="caption" name="caption" className="input" placeholder="What you were working on and what you learnt" /></div>
      <button className="btn btn-primary" disabled={pending}>{pending ? "Uploading…" : "Add photos"}</button>
      <p className="hint">Private training record. Never published and never counted as client work. Client photos need the client&apos;s consent first.</p>
    </form>
  );
}

export function SkillsBoard({ apprenticeId, areas, mentorMode }: { apprenticeId: string; areas: AreaRow[]; mentorMode: boolean }) {
  return (
    <div className="space-y-4">
      {areas.map((a) => (
        <section key={a.key} className="card p-4">
          <h3 className="font-bold text-lg">{a.label}</h3>
          <ul className="mt-2 divide-y divide-graphite">
            {a.skills.map((s) => { const st = s.progress?.status ?? "NOT_STARTED"; const [label, tone] = STATUS[st]; return (
              <li key={s.id} className="py-2 flex flex-wrap items-start gap-2">
                <div className="flex-1 min-w-[12rem]"><p className="font-semibold">{s.title}{!s.isCore && <span className="hint"> · optional</span>}</p><p className="hint">{s.description}</p>{s.progress?.apprenticeNote && <p className="text-sm mt-1">Apprentice: {s.progress.apprenticeNote}</p>}{s.progress?.mentorNote && <p className="text-sm mt-1">Mentor: {s.progress.mentorNote}</p>}{s.progress?.signedOffAt && <p className="hint">Signed off {d(s.progress.signedOffAt)}{s.progress.signedOffByName ? ` by ${s.progress.signedOffByName}` : ""}</p>}</div>
                <span className={`badge ${tone}`}>{label}</span>
                {!mentorMode && st !== "COMPETENT" && (
                  <form action={updateSkillAction} className="flex gap-1 items-center"><input type="hidden" name="apprenticeId" value={apprenticeId} /><input type="hidden" name="skillId" value={s.id} /><input name="note" className="input !min-h-9 !py-1 text-sm w-40" placeholder="note" />{st !== "READY_FOR_REVIEW" && st !== "IN_PROGRESS" && <button name="status" value="IN_PROGRESS" className="btn btn-secondary !min-h-9 !py-1 text-sm">Start</button>}{st !== "READY_FOR_REVIEW" && <button name="status" value="READY_FOR_REVIEW" className="btn btn-primary !min-h-9 !py-1 text-sm">Ready for review</button>}</form>
                )}
                {mentorMode && (
                  <form action={updateSkillAction} className="flex gap-1 items-center"><input type="hidden" name="apprenticeId" value={apprenticeId} /><input type="hidden" name="skillId" value={s.id} /><input name="note" className="input !min-h-9 !py-1 text-sm w-44" placeholder="mentor note" />{st !== "COMPETENT" && <button name="status" value="COMPETENT" className="btn btn-primary !min-h-9 !py-1 text-sm">Sign off</button>}{st === "COMPETENT" && <button name="status" value="RENEWAL_DUE" className="btn btn-secondary !min-h-9 !py-1 text-sm">Renewal due</button>}{st === "READY_FOR_REVIEW" && <button name="status" value="IN_PROGRESS" className="btn btn-secondary !min-h-9 !py-1 text-sm">Not yet</button>}</form>
                )}
              </li>); })}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function HoursTable({ apprenticeId, logs, mentorMode }: { apprenticeId: string; logs: LogRow[]; mentorMode: boolean }) {
  return (
    <table className="data"><thead><tr><th>Date</th><th>Hours</th><th>Activity</th><th>Supervisor</th><th>Status</th>{mentorMode && <th></th>}</tr></thead><tbody>
      {logs.map((l) => <tr key={l.id}><td>{d(l.date)}</td><td>{(l.minutes / 60).toFixed(2)}</td><td>{l.activity}{l.notes ? <span className="hint block">{l.notes}</span> : null}</td><td>{l.supervisorName ?? "—"}</td><td>{l.verifiedAt ? <span className="badge badge-acid">Verified</span> : l.rejectedNote ? <span className="badge badge-danger" title={l.rejectedNote}>Not verified</span> : <span className="badge badge-warn">Pending</span>}</td>{mentorMode && <td>{!l.verifiedAt && <form action={verifyHoursAction} className="flex gap-1"><input type="hidden" name="logId" value={l.id} /><input type="hidden" name="apprenticeId" value={apprenticeId} /><button name="decision" value="verify" className="btn btn-primary !min-h-9 !py-1 text-sm">Verify</button><input name="note" className="input !min-h-9 !py-1 text-sm w-28" placeholder="reason" /><button name="decision" value="reject" className="btn btn-secondary !min-h-9 !py-1 text-sm">Reject</button></form>}</td>}</tr>)}
      {logs.length === 0 && <tr><td colSpan={6} className="opacity-60">No hours logged yet.</td></tr>}
    </tbody></table>
  );
}

export function EvidenceGrid({ apprenticeId, items, mentorMode }: { apprenticeId: string; items: EvidenceRow[]; mentorMode: boolean }) {
  if (items.length === 0) return <p className="opacity-60">No photos yet.</p>;
  return (
    <ul className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {items.map((e) => <li key={e.id} className="card overflow-hidden"><a href={e.url} target="_blank" rel="noreferrer"><img src={e.url} alt={e.caption ?? "Practice work"} className="aspect-square object-cover w-full" /></a><div className="p-2 text-sm"><p className="hint">{d(e.createdAt)} · {e.stage?.replace("_", " ")}{e.skillTitle ? ` · ${e.skillTitle}` : ""}</p>{e.caption && <p>{e.caption}</p>}{e.mentorComment && <p className="mt-1 text-acid-bright">Mentor: {e.mentorComment}</p>}{mentorMode && <form action={commentEvidenceAction} className="mt-2 flex gap-1"><input type="hidden" name="evidenceId" value={e.id} /><input type="hidden" name="apprenticeId" value={apprenticeId} /><input name="comment" className="input !min-h-9 !py-1 text-sm" placeholder="feedback" /><button className="btn btn-secondary !min-h-9 !py-1 text-sm">Save</button></form>}</div></li>)}
    </ul>
  );
}

export function JuniorSignoffForm({ apprenticeId, ready, blockers }: { apprenticeId: string; ready: boolean; blockers: string[] }) {
  const [state, action, pending] = useActionState(juniorSignoffAction, undefined);
  return (
    <form action={action} className="card p-5 border-2 border-acid space-y-3">
      <h2 className="text-xl font-bold">Sign off as junior artist</h2>
      {!ready && <Alert tone="warn">Not yet eligible: {blockers.join("; ")}.</Alert>}
      {state?.error && <Alert tone="danger">{state.error}</Alert>}{state?.ok && <Alert tone="success">Signed off. Their profile is now a junior artist and they can take supervised bookings.</Alert>}
      <input type="hidden" name="apprenticeId" value={apprenticeId} />
      <div><label className="field" htmlFor="statement">Your statement (kept permanently)</label><textarea id="statement" name="statement" className="textarea" rows={3} required minLength={20} placeholder="What you have seen them do competently and why they are ready." /></div>
      <div><label className="field" htmlFor="conditions">Conditions (optional)</label><input id="conditions" name="conditions" className="input" placeholder="e.g. Supervised for colour work until further review in March" /></div>
      <div><label className="field" htmlFor="confirm">Type SIGN OFF to confirm</label><input id="confirm" name="confirm" className="input" autoComplete="off" /></div>
      <button className="btn btn-primary" disabled={pending || !ready}>{pending ? "Recording…" : "Sign off as junior artist"}</button>
      <p className="hint">This is a studio decision, not a qualification or accreditation. It cannot be undone; a later review can add conditions.</p>
    </form>
  );
}
