"use client";
import { useActionState } from "react";
import { sendRestockAlertsAction } from "@/app/actions/gumball";
import { Alert } from "@/components/ui";
export function RestockAlertsButton() {
  const [state, action, pending] = useActionState(sendRestockAlertsAction, undefined);
  return <form action={action} className="space-y-2">{state?.error && <Alert tone={state.ok ? "success" : "danger"}>{state.error}</Alert>}<button className="btn btn-secondary" disabled={pending}>Email everyone waiting that the machine is full</button></form>;
}
