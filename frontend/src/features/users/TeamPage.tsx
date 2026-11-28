"use client";

import { useCallback, useEffect, useState } from "react";
import { UserPlus, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Panel } from "@/components/ui/Panel";
import { useToast } from "@/components/providers/ToastProvider";
import { createUser, deactivateUser, listUsers } from "@/features/users/api";
import type { Role, StaffUser } from "@/lib/api/contracts";
import { initials, roleLabels } from "@/lib/presentation";

export function TeamPage() {
  const showToast = useToast();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<"create" | StaffUser | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try { setUsers(await listUsers()); }
    catch (reason) { showToast(reason instanceof Error ? reason.message : "Xodimlar yuklanmadi.", "error"); }
    finally { setLoading(false); }
  }, [showToast]);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) void refresh(); });
    return () => { active = false; };
  }, [refresh]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (dialog !== "create") return;
    const data = new FormData(event.currentTarget); const username = String(data.get("username")).trim().toLowerCase();
    setBusy(true);
    try {
      await createUser({ username, password: String(data.get("password")), role: String(data.get("role")) as Extract<Role, "seller" | "viewer"> });
      showToast(`${username} xodimi qo‘shildi. Boshlang‘ich parolni unga xavfsiz tarzda alohida yetkazing.`);
      setDialog(null); await refresh();
    } catch (reason) { showToast(reason instanceof Error ? `${reason.message}. Login band emasligini va parol uzunligini tekshiring.` : "Xodim qo‘shilmadi.", "error"); }
    finally { setBusy(false); }
  }

  async function deactivate() {
    if (typeof dialog !== "object" || !dialog) return;
    const selected = dialog; setBusy(true);
    try { await deactivateUser(selected.id); showToast(`${selected.username} foydalanuvchisi faol emas deb belgilandi.`); setDialog(null); await refresh(); }
    catch (reason) { showToast(reason instanceof Error ? reason.message : "Xodim holati yangilanmadi.", "error"); }
    finally { setBusy(false); }
  }

  return <div className="page">
    <header className="page-head"><div><h1>Xodimlar</h1><p>Hisoblar va ruxsatlarni boshqaring. Parollar ro‘yxatda ko‘rsatilmaydi.</p></div><Button icon={<UserPlus size={15} />} onClick={() => setDialog("create")}>Xodim qo‘shish</Button></header>
    <div className="team-layout"><Panel className="table-panel"><div className="panel-header"><div><h2>Kompaniya xodimlari</h2><p>Foydalanuvchilar roli va faol holati</p></div><span className="role-chip">{users.length} ta yuklandi</span></div>
      {loading ? <LoadingState /> : users.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>Foydalanuvchi</th><th>Roli</th><th>Holati</th><th>Amal</th></tr></thead><tbody>{users.map((item) => <tr key={item.id}><td><div className="person"><span className="avatar"><UserRound size={14} /></span><span><strong>{item.username}</strong><small>Hisob #{item.id} · {initials(item.username)}</small></span></div></td><td><span className={`role-chip${item.role === "admin" ? " role-chip--admin" : ""}`}>{roleLabels[item.role]}</span></td><td><span className={`status-badge status-badge--${item.active ? "active" : "inactive"}`}>{item.active ? "Faol" : "Faol emas"}</span></td><td>{item.active && item.role !== "admin" ? <Button variant="danger" size="small" onClick={() => setDialog(item)}>Faoliyatni to‘xtatish</Button> : "—"}</td></tr>)}</tbody></table></div> : <EmptyState title="Xodimlar ro‘yxati bo‘sh" description="Ish maydoniga kirish uchun sotuv menejeri yoki kuzatuvchi qo‘shing." />}
    </Panel><Panel className="role-panel"><div className="panel-header"><div><h2>Rollar va ruxsatlar</h2><p>Backend tekshiradigan amallar</p></div></div><div className="role-info"><div><strong>Administrator</strong><span>Arizalar, xonadonlar, narxlar, xodimlar va amallar tarixini boshqaradi.</span></div><div><strong>Sotuv menejeri</strong><span>Arizalarni ko‘radi, bosqichini yangilaydi va ko‘rikdan keyin sotuvni tasdiqlaydi.</span></div><div><strong>Kuzatuvchi</strong><span>Arizalarni o‘qiydi; ma’lumotni o‘zgartira olmaydi.</span></div></div><p className="field-hint role-footnote">Administrator hisobini bu oynadan yaratish yoki o‘chirish mumkin emas.</p></Panel></div>

    <Dialog open={dialog === "create"} onClose={() => !busy && setDialog(null)} title="Yangi xodim" description="Xodim parolni alohida oladi; u audit ro‘yxatida ham ko‘rinadi.">
      <form className="dialog-form" onSubmit={(event) => void submit(event)}><div className="field"><label htmlFor="staff-username">Foydalanuvchi nomi</label><input id="staff-username" name="username" required minLength={3} maxLength={80} pattern="[a-z0-9_.-]+" autoComplete="off" placeholder="masalan, ali.sotuvchi" /><p className="field-hint">Kichik lotin harfi, raqam, nuqta, pastki chiziq va chiziqcha.</p></div><div className="field"><label htmlFor="staff-password">Boshlang‘ich parol</label><input id="staff-password" name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /><p className="field-hint">Kamida 12 belgi. Parol oynada qayta ko‘rsatilmaydi.</p></div><div className="field"><label htmlFor="staff-role">Roli</label><select id="staff-role" name="role"><option value="seller">Sotuv menejeri</option><option value="viewer">Kuzatuvchi</option></select><p className="field-hint">Admin rolini yaratish endpointi mavjud emas.</p></div><div className="form-actions"><Button variant="secondary" type="button" onClick={() => setDialog(null)} disabled={busy}>Bekor qilish</Button><Button loading={busy}>Xodimni qo‘shish</Button></div></form>
    </Dialog>
    <Dialog open={typeof dialog === "object" && dialog !== null} onClose={() => !busy && setDialog(null)} title="Xodim faoliyatini to‘xtatish" description="Bu amal audit tarixiga yoziladi.">
      {typeof dialog === "object" && dialog && <div className="dialog-form"><p className="confirm-summary"><strong>{dialog.username}</strong><span>Foydalanuvchi tizimga kira olmaydi va tokenlari bekor qilinadi.</span></p><div className="form-actions"><Button variant="secondary" onClick={() => setDialog(null)} disabled={busy}>Bekor qilish</Button><Button variant="danger" loading={busy} onClick={() => void deactivate()}>Faoliyatni to‘xtatish</Button></div></div>}
    </Dialog>
  </div>;
}
