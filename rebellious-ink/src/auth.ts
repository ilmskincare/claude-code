import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";

/**
 * Passwordless email sign-in for clients and staff. Privileged roles must
 * additionally enrol MFA (ticket P1-14) before production go-live.
 */
export const { handlers, auth, signIn, signOut } = NextAuth(() => ({
  adapter: PrismaAdapter(db),
  session: { strategy: "database", maxAge: 60 * 60 * 24 * 14 },
  pages: { signIn: "/login", verifyRequest: "/login/check-email", error: "/login" },
  providers: [
    Resend({
      from: env().EMAIL_FROM,
      apiKey: env().RESEND_API_KEY ?? "unset",
      async sendVerificationRequest({ identifier, url }) {
        const host = new URL(url).host;
        await sendEmail({
          to: identifier,
          templateKey: "auth.magic_link",
          subject: `Your sign-in link for Rebellious Ink`,
          text: `Sign in to Rebellious Ink (${host}):\n\n${url}\n\nIf you did not request this, you can ignore this email.`,
          html: `<p>Sign in to <strong>Rebellious Ink</strong> (${host}):</p><p><a href="${url}">Sign in</a></p><p>If you did not request this, ignore this email.</p>`,
        });
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
    async signIn({ user }) {
      if (!user.email) return false;
      const existing = await db.user.findUnique({ where: { email: user.email }, select: { isSuspended: true } });
      if (existing?.isSuspended) return false;
      return true;
    },
  },
  events: {
    async signIn({ user }) {
      if (user.id) {
        await db.deviceLog.create({ data: { userId: user.id, event: "signed_in" } }).catch(() => undefined);
        await db.clientProfile.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} }).catch(() => undefined);
      }
    },
  },
}));
