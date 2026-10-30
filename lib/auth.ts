import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { callApi } from "./api";
import type { SessionUser } from "./types";

const devMock = process.env.DEV_MOCK === "1" && process.env.NODE_ENV !== "production";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  pages: { signIn: "/login", error: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 12 },
  callbacks: {
    // Hanya email yang terdaftar & Aktif di MASTER_USER yang boleh masuk.
    async signIn({ user, account, profile }) {
      const email = user.email?.toLowerCase();
      if (!email) return false;
      if (account?.provider === "google" && (profile as any)?.email_verified === false) return false;
      try {
        const who = await callApi<{ allowed: boolean; name: string; role: string }>("whoami", email);
        return who.allowed;
      } catch {
        return false;
      }
    },
    async jwt({ token }) {
      // Ambil ulang peran tiap sesi baru; kalau pengguna dinonaktifkan, token berhenti berlaku.
      if (token.email && (!token.role || token.checkedAt === undefined || Date.now() - (token.checkedAt as number) > 5 * 60 * 1000)) {
        try {
          const who = await callApi<{ allowed: boolean; name: string; role: string }>("whoami", String(token.email));
          if (!who.allowed) return { ...token, role: null, revoked: true };
          token.role = who.role;
          token.displayName = who.name;
          token.revoked = false;
          token.checkedAt = Date.now();
        } catch {
          /* pakai nilai lama bila Apps Script sedang tidak terjangkau */
        }
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).role = token.role ?? null;
      (session as any).revoked = token.revoked ?? false;
      if (token.displayName) session.user = { ...session.user, name: token.displayName as string };
      return session;
    },
  },
};

/** Dipakai di halaman server. Mengembalikan null bila belum login / sudah dinonaktifkan. */
export async function currentUser(): Promise<SessionUser | null> {
  if (devMock) return { email: "uji@example.com", name: "Karvien (uji)", role: "Owner" };
  const s = await getServerSession(authOptions);
  if (!s?.user?.email || (s as any).revoked) return null;
  return { email: s.user.email.toLowerCase(), name: s.user.name ?? s.user.email, role: (s as any).role ?? "" };
}
