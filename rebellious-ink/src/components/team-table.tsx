"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { issueCredentialsAction, changeRoleAction, setStaffStatusAction, setJobTitleAction } from "@/app/actions/staff-auth";
import { Alert } from "./ui";

export type TeamRow = { membershipId: string; userId: string; name: string; fullName: string | null; jobTitle: string | null; email: string | null; username: string | null; hasPassword: boolean; mustChangePassword: boolean; locked: boolean; role: string; status: string; profileId: string | null; kind: string | null; isPublished: boolean };

/** The name with the job title in brackets, and a small form to change the title. The title is a label only; access is the dropdown. */
function PersonCell({ row }: { row: TeamRow }) {
  const [state, action, pending] = useActionState(setJobTitleAction, undefined);
  const [open, setOpen] = useState(false);
  return (
    <div>
      <strong>{row.name}</strong>{row.jobTitle && <span className="opacity-80"> ({row.jobTitle})</span>}
      {row.fullName && row.fullName !== row.name && <span className="block text-xs opacity-60">{row.fullName}</span>}
      {row.profileId && <span className="block text-xs"><Link href={`/owner/artists/${row.profileId}/profile`} className="underline">Profile & rates</Link> · <Link href={`/owner/artists/${row.profileId}/hours`} className="underline">Hours</Link>{!row.isPublished && <span className="opacity-60"> · not on public site</span>}</span>}
      <button type="button" className="block underline text-xs mt-1" onClick={() => setOpen((o) => !o)}>{row.jobTitle ? "Change job title" : "Add job title"}</button>
      {open && <form action={action} className="mt-1 flex gap-1 items-end">
        <input type="hidden" name="userId" value={row.userId} />
        <div><label className="sr-only" htmlFor={`jt-${row.userId}`}>Job title for {row.name}</label><input id={`jt-${row.userId}`} name="jobTitle" className="input text-sm" placeholder="e.g. Studio manager" maxLength={40} defaultValue={row.jobTitle ?? ""} /></div>
        <button className="btn btn-secondary text-sm" disabled={pending}>{pending ? "…" : "Save"}</button>
      </form>}
      {state?.error && <span className="block text-xs text-danger" role="alert">{state.error}</span>}{state?.ok && <span className="block text-xs text-acid-bright">{state.message}</span>}
    </div>
  );
}

function RoleCell({ row, roles, labels }: { row: TeamRow; roles: readonly string[]; labels: Record<string, string> }) {
  const [state, action, pending] = useActionState(changeRoleAction, undefined);
  return (
    <form action={action} className="flex flex-col gap-1">
      <input type="hidden" name="userId" value={row.userId} />
      <label className="sr-only" htmlFor={`role-${row.userId}`}>Access for {row.name}</label>
      <div className="flex gap-1"><select id={`role-${row.userId}`} name="role" className="select text-sm" defaultValue={row.role}>{roles.map((r) => <option key={r} value={r}>{labels[r]}</option>)}</select><button className="btn btn-secondary text-sm" disabled={pending}>Save</button></div>
      {state?.error && <span className="text-xs text-danger" role="alert">{state.error}</span>}{state?.ok && <span className="text-xs text-acid-bright">{state.message}</span>}
    </form>
  );
}

function CredentialsCell({ row }: { row: TeamRow }) {
  const [state, action, pending] = useActionState(issueCredentialsAction, undefined);
  const [open, setOpen] = useState(false);
  return (
    <div className="text-sm">
      <p>{row.username ? <span className="font-mono">{row.username}</span> : <span className="opacity-60">no username</span>}{row.email ? <span className="block text-xs opacity-60">{row.email}</span> : <span className="block text-xs opacity-60">no email: password sign-in only</span>}</p>
      {row.locked && <span className="badge badge-warn">locked</span>}{row.mustChangePassword && <span className="badge badge-muted">must set password</span>}
      {state?.ok ? <Alert tone="success"><span className="text-xs">{state.message}</span><code className="block mt-1 text-base select-all">{state.tempPassword}</code></Alert> : (
        <>
          <button type="button" className="underline text-xs mt-1" onClick={() => setOpen((o) => !o)}>{row.hasPassword ? "Reset password" : "Give a username and password"}</button>
          {open && <form action={action} className="mt-1 flex gap-1 items-end">
            <input type="hidden" name="userId" value={row.userId} />
            {!row.username && <div><label className="sr-only" htmlFor={`un-${row.userId}`}>Username</label><input id={`un-${row.userId}`} name="username" className="input text-sm" placeholder="username" defaultValue={row.fullName ? row.fullName.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "") : ""} /></div>}
            <button className="btn btn-primary text-sm" disabled={pending}>{pending ? "…" : row.hasPassword ? "Reset" : "Create"}</button>
          </form>}
          {state?.error && <span className="block text-xs text-danger" role="alert">{state.error}</span>}
        </>
      )}
    </div>
  );
}

function StatusCell({ row }: { row: TeamRow }) {
  const [state, action, pending] = useActionState(setStaffStatusAction, undefined);
  const suspended = row.status === "SUSPENDED";
  return (
    <form action={action} className="text-sm">
      <input type="hidden" name="userId" value={row.userId} /><input type="hidden" name="status" value={suspended ? "ACTIVE" : "SUSPENDED"} />
      <span className={`badge ${suspended ? "badge-warn" : "badge-acid"}`}>{row.status.toLowerCase()}</span>
      <button className="underline text-xs ml-2" disabled={pending} onClick={(e) => { if (!suspended && !confirm(`Suspend ${row.name}? They are signed out everywhere and hidden from the public site until reactivated.`)) e.preventDefault(); }}>{suspended ? "Reactivate" : "Suspend"}</button>
      {state?.error && <span className="block text-xs text-danger" role="alert">{state.error}</span>}{state?.ok && <span className="block text-xs text-acid-bright">{state.message}</span>}
    </form>
  );
}

/** The owner's team table: who they are, how they sign in, what they can do, and whether they are active. */
export function TeamTable({ rows, roles, labels }: { rows: TeamRow[]; roles: readonly string[]; labels: Record<string, string> }) {
  return (
    <section className="card p-4 mb-10">
      <h2 className="text-xl font-bold mb-1">The team</h2>
      <p className="hint mb-3">Change someone&apos;s access from the dropdown; a job title is just a label shown in brackets after their name. &ldquo;Give a username and password&rdquo; lets them sign in without an email; a reset signs them out everywhere and gives a new one-time password.</p>
      <div className="overflow-x-auto"><table className="data"><thead><tr><th>Person</th><th>Sign-in</th><th>Access</th><th>Status</th></tr></thead><tbody>
        {rows.map((r) => <tr key={r.membershipId}><td><PersonCell row={r} /></td><td><CredentialsCell row={r} /></td><td><RoleCell row={r} roles={roles} labels={labels} /></td><td><StatusCell row={r} /></td></tr>)}
      </tbody></table></div>
    </section>
  );
}
