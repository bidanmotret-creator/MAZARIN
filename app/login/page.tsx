import LoginForm from "@/components/LoginForm";
import { L } from "@/lib/labels";

export default function LoginPage() {
  return (
    <main className="center">
      <div className="card login narrow" style={{ width: "100%" }}>
        <div className="emoji" style={{ fontSize: "2.2rem" }}>🌿</div>
        <h1>{L.app}</h1>
        <p className="muted">Masuk dengan email dan kata sandi dari tim kami.</p>
        <LoginForm />
        <p className="hint" style={{ marginTop: 14 }}>Lupa kata sandi? Hubungi admin untuk dibuatkan yang baru.</p>
      </div>
    </main>
  );
}
