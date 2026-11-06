"use server";
import { signIn, signOut } from "@/auth";
import { z } from "zod";
import { redirect } from "next/navigation";

const schema = z.object({ email: z.string().trim().email(), next: z.string().optional() });

export async function requestMagicLink(_prev: { error?: string } | undefined, formData: FormData) {
  const parsed = schema.safeParse({ email: formData.get("email"), next: formData.get("next") ?? undefined });
  if (!parsed.success) return { error: "Please enter a valid email address." };
  const next = parsed.data.next && parsed.data.next.startsWith("/") ? parsed.data.next : "/after-login";
  await signIn("resend", { email: parsed.data.email.toLowerCase(), redirectTo: next, redirect: false });
  redirect(`/login/check-email?email=${encodeURIComponent(parsed.data.email.toLowerCase())}`);
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
