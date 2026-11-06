import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { requireAdmin } from "@/lib/admin-auth";
import { envChecks } from "@/lib/env";
import { getSettings } from "@/lib/settings";
import { storageDriver } from "@/lib/storage";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getSettings();
  const checks = envChecks();
  const missing = checks.filter((c) => !c.set);

  return (
    <div>
      <p className="eyebrow">Admin</p>
      <h1 className="mt-1 text-2xl font-extrabold">Settings</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
        <section aria-labelledby="store">
          <h2 id="store" className="text-lg font-bold">Store</h2>
          <div className="card mt-3 p-4">
            <SettingsForm settings={settings} />
          </div>
        </section>

        <section aria-labelledby="env">
          <h2 id="env" className="text-lg font-bold">Connections</h2>
          <p className="hint mt-1 text-sm">Set these as environment variables in the hosting dashboard. Values are never shown here.</p>
          {missing.length === 0 ? (
            <p className="mt-3 text-sm text-ok" role="status">Everything is connected.</p>
          ) : (
            <p className="mt-3 text-sm text-warn" role="status">{missing.length} missing: {missing.map((m) => m.name).join(", ")}.</p>
          )}
          <ul className="mt-3 space-y-2">
            {checks.map((c) => (
              <li key={c.name} className="card-2 flex items-start gap-3 p-3 text-sm">
                <span className={`badge ${c.set ? "badge-ok" : "badge-danger"}`}>{c.set ? "set" : "missing"}</span>
                <span className="min-w-0">
                  <span className="block break-words font-mono text-xs">{c.name}</span>
                  <span className="hint block text-xs">{c.purpose}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="hint mt-3 text-xs">Photo storage in use: {storageDriver() === "blob" ? "Vercel Blob" : "local disk (development only)"}.</p>
        </section>
      </div>
    </div>
  );
}
