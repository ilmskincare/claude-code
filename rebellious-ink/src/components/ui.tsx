import Image from "next/image";
import Link from "next/link";
import type { EnquiryStatus, AppointmentStatus } from "@/generated/prisma/enums";
import { STATUS_LABELS } from "@/lib/enquiry-state";

export function Logo({ size = 44, withWordmark = true }: { size?: number; withWordmark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3">
      <Image src="/brand/rebellious-ink-logo.jpg" alt="Rebellious Ink" width={size} height={size} className="rounded-full" priority />
      {withWordmark && <span className="display font-bold text-lg tracking-wide">Rebellious Ink</span>}
    </span>
  );
}

const ENQUIRY_TONE: Partial<Record<EnquiryStatus, string>> = {
  NEW: "badge-acid", CONFIRMED: "badge-acid", COMPLETED: "badge-acid",
  AWAITING_DEPOSIT: "badge-warn", AWAITING_ACCEPTANCE: "badge-warn", NEEDS_INFORMATION: "badge-warn", FORMS_PENDING: "badge-warn", RESCHEDULE_REQUESTED: "badge-warn",
  CANCELLED: "badge-danger", DECLINED: "badge-danger", NO_SHOW: "badge-danger", DISPUTED: "badge-danger", EXPIRED: "badge-danger",
};

export function EnquiryBadge({ status }: { status: EnquiryStatus }) {
  return <span className={`badge ${ENQUIRY_TONE[status] ?? "badge-muted"}`}>{STATUS_LABELS[status]}</span>;
}

const APPT_LABEL: Record<AppointmentStatus, string> = { PENDING_DEPOSIT: "Awaiting deposit", CONFIRMED: "Confirmed", CHECKED_IN: "Checked in", IN_SESSION: "In session", COMPLETED: "Completed", CANCELLED: "Cancelled", NO_SHOW: "No-show" };
const APPT_TONE: Partial<Record<AppointmentStatus, string>> = { PENDING_DEPOSIT: "badge-warn", CONFIRMED: "badge-acid", COMPLETED: "badge-acid", CANCELLED: "badge-danger", NO_SHOW: "badge-danger" };
export function AppointmentBadge({ status }: { status: AppointmentStatus }) {
  return <span className={`badge ${APPT_TONE[status] ?? "badge-muted"}`}>{APPT_LABEL[status]}</span>;
}

export function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="card p-4 stat">
      <span className="value">{value}</span>
      <span className="label">{label}</span>
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

export function PageHeader({ title, intro, actions }: { title: string; intro?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold">{title}</h1>
        {intro && <p className="mt-2 max-w-2xl opacity-80">{intro}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function Alert({ tone = "info", children }: { tone?: "info" | "success" | "warn" | "danger"; children: React.ReactNode }) {
  const cls = { info: "border-acid-deep bg-acid-soft/40 text-ink", success: "border-acid bg-acid-soft/60 text-ink", warn: "border-warn bg-warn/20 text-ink", danger: "border-danger bg-danger/10 text-ink" }[tone];
  return <div role={tone === "danger" ? "alert" : "status"} className={`border-l-4 rounded-md px-4 py-3 ${cls}`}>{children}</div>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="card p-8 text-center opacity-70">{children}</div>;
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="inline-block mb-4 underline underline-offset-4 opacity-80 hover:opacity-100">← {children}</Link>;
}
