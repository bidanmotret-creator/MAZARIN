import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { callApi } from "./api";
import type { SessionUser } from "./types";

const devMock = process.env.DEV_MOCK === "1" && process.env.NODE_ENV !== "production";

export const MIN_PASSWORD = 10;
export const MAX_PASSWORD = 72; // batas bcrypt

type AuthInfo = { allowed: boolean; name: string; role: string; hash: string; locked: boolean };

// Hash tiruan supaya waktu respons tidak membocorkan apakah sebuah email terdaftar.
let dummyHash: string | null = null;
const getDummy = () => (dummyHash ??= bcrypt.hashSync("tidak-dipakai-sama-sekali", 12));

/** Memeriksa email + kata sandi. Mengembalikan null untuk SEMUA jenis kegagalan (pesan sengaja seragam). */
export async function verifyPassword(email: string, password: string): Promise<{ name: string; role: string } | null> {
  if (!email || !password || password.length > MAX_PASSWORD) return null;

  let info: AuthInfo;
  try {
    info = await callApi<AuthInfo>("auth.get", email);
  } catch {
    return null;
  }

  if (info.locked) {
    await bcrypt.compare(password, getDummy());
    return null;
  }

  const ok = await bcrypt.compare(password, info.hash || getDummy());
  if (!ok || !info.allowed || !info.hash) {
    await callApi("auth.fail", email).catch(() => undefined);
    return null;
  }
  await callApi("auth.clear", email).catch(() => undefined);
  return { name: info.name, role: info.role };
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Email dan kata sandi",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Kata sandi", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        const who = await verifyPassword(email, password);
        if (!who) return null;
        return { id: email, email, name: who.name };
      },
    }),
  ],
  pages: { signIn: "/login", error: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 12 },
  callbacks: {
    async jwt({ token }) {
      // Cek ulang peran/status tiap beberapa menit; pengguna yang dinonaktifkan ikut terkunci.
      const stale = token.checkedAt === undefined || Date.now() - (token.checkedAt as number) > 5 * 60 * 1000;
      if (token.email && stale) {
        try {
          const who = await callApi<{ allowed: boolean; name: string; role: string }>("whoami", String(token.email));
          if (!who.allowed) return { ...token, role: null, revoked: true, checkedAt: Date.now() };
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
