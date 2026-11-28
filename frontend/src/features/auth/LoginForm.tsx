"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, Building2, KeyRound, LockKeyhole } from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const { authenticate, status } = useAuth();
  const showToast = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (status === "signed-in") {
      const next = params.get("next") ?? "/";
      router.replace(next.startsWith("/") && !next.startsWith("//") ? next : "/");
    }
  }, [params, router, status]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("");
    try { await authenticate(username, password); showToast("Ish maydoniga xush kelibsiz."); }
    catch (reason) { const message = reason instanceof Error ? reason.message : "Kirish bajarilmadi."; setError(message); }
    finally { setPending(false); }
  }

  return <main className="login-screen">
    <section className="login-presentation"><Link className="brand login-brand" href="/"><span className="brand-mark"><Building2 size={18} /></span><span><strong>Qurilish CRM</strong><small>Savdo va xonadonlar</small></span></Link>
      <div className="login-message"><div className="login-glass-mark"><Building2 size={24} aria-hidden="true" /></div><h1>Arizadan kalitgacha — bitta ish maydoni.</h1><p>Mijozlar bilan aloqani, xonadon katalogini va savdo holatini tartibli yuriting.</p><div className="login-rule"><span>Yagona ish maydoni</span><span>Rollar bo‘yicha ruxsat</span></div></div>
      <div className="login-bottom"><span>Uzbekcha · Lotin yozuvi</span><Link href="/catalog" target="_blank" rel="noreferrer">Ochiq katalog <ArrowUpRight size={14} /></Link></div>
    </section>
    <section className="login-panel-wrap"><div className="login-panel glass-panel"><span className="login-panel-icon"><KeyRound size={18} /></span><h2>Ish maydoniga kiring</h2><p>Administrator yoki xodim hisob ma’lumotlarini kiriting.</p>{error && <div className="form-error" role="alert">{error}</div>}
      <form className="login-fields" onSubmit={(event) => void submit(event)}><div className="field"><label htmlFor="login-username">Foydalanuvchi nomi</label><input id="login-username" name="username" autoComplete="username" required maxLength={80} value={username} onChange={(event) => setUsername(event.target.value)} placeholder="masalan, sotuvchi" /></div><div className="field"><label htmlFor="login-password">Parol</label><div className="password-field"><LockKeyhole size={15} aria-hidden="true" /><input id="login-password" name="password" type="password" autoComplete="current-password" required maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Parolni kiriting" /></div></div><Button className="login-submit" loading={pending}>Kirish</Button></form>
      <div className="login-footer">Hisobingiz yo‘qmi? Kompaniya administratoriga murojaat qiling.</div>
    </div></section>
  </main>;
}
