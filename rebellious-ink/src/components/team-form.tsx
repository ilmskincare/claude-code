"use client";
import { useActionState, useState } from "react";
import { addTeamMemberAction } from "@/app/actions/team";
import { Alert } from "./ui";

type Kind = "TATTOO_ARTIST" | "JUNIOR_ARTIST" | "PIERCER" | "APPRENTICE" | "RECEPTION";

/** Owner adds an artist, junior artist, piercer, apprentice or desk member. */
export function AddTeamMemberForm({ stations, supervisors }: { stations: { id: string; name: string }[]; supervisors: { id: string; displayName: string; kind: string }[] }) {
  const [state, action, pending] = useActionState(addTeamMemberAction, undefined);
  const [kind, setKind] = useState<Kind>("TATTOO_ARTIST");
  const [signIn, setSignIn] = useState<"email" | "password">("password");
  const isArtist = kind === "TATTOO_ARTIST" || kind === "JUNIOR_ARTIST";
  const hasProfile = kind !== "RECEPTION";
  return (
    <form action={action} className="card p-5 space-y-3" id="add-team-member">
      <h2 className="text-xl font-bold">Add someone to the team</h2>
      <p className="text-sm opacity-80">Staff can sign in with a username and password you give them (no email needed), or with a link emailed to them. You can edit their profile, rates and hours from the list afterwards.</p>
      {state?.error && <Alert tone="danger">{state.error}</Alert>}{state?.ok && <Alert tone="success">{state.message}{state.tempPassword && <code className="block mt-1 text-lg select-all">{state.tempPassword}</code>}</Alert>}
      <div className="grid sm:grid-cols-2 gap-3">
        <div><label className="field" htmlFor="tm-kind">What they do</label><select id="tm-kind" name="kind" className="select" value={kind} onChange={(e) => setKind(e.target.value as Kind)}><option value="TATTOO_ARTIST">Tattoo artist</option><option value="JUNIOR_ARTIST">Junior artist</option><option value="PIERCER">Piercer</option><option value="APPRENTICE">Apprentice</option><option value="RECEPTION">Desk (reception)</option></select></div>
        {isArtist && <div><label className="field" htmlFor="tm-arrangement">Arrangement</label><select id="tm-arrangement" name="arrangement" className="select" defaultValue="RESIDENT_ARTIST"><option value="RESIDENT_ARTIST">Resident (commission)</option><option value="CHAIR_RENT_ARTIST">Chair rent</option><option value="GUEST_ARTIST">Guest spot</option></select><p className="hint">Sets what they can see. The money side is set under Arrangements.</p></div>}
        {kind === "APPRENTICE" && <div><label className="field" htmlFor="tm-supervisor">Supervisor</label><select id="tm-supervisor" name="supervisorId" className="select" required defaultValue=""><option value="" disabled>Choose…</option>{supervisors.map((s) => <option key={s.id} value={s.id}>{s.displayName}</option>)}</select><p className="hint">Their client slots only open while this person is in.</p></div>}
        <div><label className="field" htmlFor="tm-name">Full name</label><input id="tm-name" name="name" className="input" required /></div>
        <div><label className="field" htmlFor="tm-signin">How they sign in</label><select id="tm-signin" name="signIn" className="select" value={signIn} onChange={(e) => setSignIn(e.target.value as "email" | "password")}><option value="password">Username and password (no email needed)</option><option value="email">Email link</option></select></div>
        {signIn === "password" ? <div><label className="field" htmlFor="tm-username">Username</label><input id="tm-username" name="username" className="input" autoCapitalize="none" spellCheck={false} placeholder="e.g. sean" /><p className="hint">Leave blank to make one from their name. You will be shown a one-time password to give them.</p></div> : null}
        <div><label className="field" htmlFor="tm-email">Email{signIn === "password" ? " (optional)" : ""}</label><input id="tm-email" name="email" type="email" className="input" required={signIn === "email"} /></div>
        {hasProfile && <>
          <div><label className="field" htmlFor="tm-display">Name shown to clients</label><input id="tm-display" name="displayName" className="input" required placeholder="e.g. Elle Evaa" /></div>
          <div><label className="field" htmlFor="tm-station">Usual station</label><select id="tm-station" name="stationId" className="select" defaultValue=""><option value="">Not set</option>{stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div className="sm:col-span-2"><label className="field" htmlFor="tm-styles">Styles (comma separated)</label><input id="tm-styles" name="styles" className="input" placeholder="e.g. fine line, blackwork, colour" /></div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="isPublished" /> Show on the public Artists page now (you can switch this later)</label>
        </>}
        {!hasProfile && <input type="hidden" name="displayName" value="Desk" />}
      </div>
      <button className="btn btn-primary" disabled={pending}>{pending ? "Adding…" : "Add to the team"}</button>
    </form>
  );
}
