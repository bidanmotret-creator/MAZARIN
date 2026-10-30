"use client";
import { signIn } from "next-auth/react";

export default function SignInButton() {
  return (
    <button className="btn" onClick={() => signIn("google", { callbackUrl: "/" })}>
      Masuk dengan Google
    </button>
  );
}
