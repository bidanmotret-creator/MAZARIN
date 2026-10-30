import SignInButton from "@/components/SignInButton";
import { L } from "@/lib/labels";

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="center">
      <div className="card login">
        <div className="emoji" style={{ fontSize: "2.2rem" }}>🌿</div>
        <h1>{L.app}</h1>
        <p className="muted">Masuk dengan akun Google yang sudah didaftarkan tim kami.</p>
        {searchParams.error && (
          <p className="banner alert" role="alert">
            Akun ini belum punya akses. Hubungi admin untuk didaftarkan, lalu coba lagi.
          </p>
        )}
        <SignInButton />
      </div>
    </main>
  );
}
