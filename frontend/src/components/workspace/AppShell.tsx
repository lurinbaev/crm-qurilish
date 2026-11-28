"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Building2, ChevronRight, ClipboardList, LayoutDashboard, LogOut, Menu, ScrollText, UsersRound, X } from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";

const roleLabels = { admin: "Administrator", seller: "Sotuv menejeri", viewer: "Kuzatuvchi" } as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const showToast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const canManage = user?.role === "admin";
  const nav = [
    { href: "/", label: "Umumiy ko‘rinish", icon: LayoutDashboard },
    { href: "/leads", label: "Arizalar", icon: ClipboardList },
    ...(canManage ? [
      { href: "/inventory", label: "Xonadonlar", icon: Building2 },
      { href: "/team", label: "Xodimlar", icon: UsersRound },
      { href: "/audit", label: "Amallar tarixi", icon: ScrollText },
    ] : []),
  ];
  const current = nav.find((item) => item.href === pathname);

  async function handleLogout() {
    try { await logout(); router.replace("/login"); }
    catch { showToast("Sessiya yopilmadi. Sahifani yangilang va qayta urinib ko‘ring.", "error"); }
  }

  return <div className={`workspace-shell${menuOpen ? " workspace-shell--menu-open" : ""}`}>
    {menuOpen && <button className="nav-scrim" type="button" aria-label="Menyuni yopish" onClick={() => setMenuOpen(false)} />}
    <aside className="sidebar" aria-label="Asosiy navigatsiya">
      <Link className="brand" href="/" onClick={() => setMenuOpen(false)}><span className="brand-mark"><Building2 size={18} /></span><span><strong>Qurilish CRM</strong><small>Savdo ish maydoni</small></span></Link>
      <p className="nav-caption">Ish maydoni</p>
      <nav className="nav-list">{nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`nav-link${pathname === href ? " nav-link--active" : ""}`} aria-current={pathname === href ? "page" : undefined} onClick={() => setMenuOpen(false)}><Icon size={17} aria-hidden="true" /><span>{label}</span>{pathname === href && <ChevronRight className="nav-current" size={14} aria-hidden="true" />}</Link>)}</nav>
      <div className="sidebar-bottom">
        <Link className="public-link" href="/catalog" target="_blank" rel="noreferrer"><Building2 size={15} /> Ochiq katalog <span>↗</span></Link>
        <div className="account-row"><span className="account-avatar">{user?.username.slice(0, 2).toLocaleUpperCase("uz-Latn")}</span><span className="account-copy"><strong>{user?.username}</strong><small>{user?.role ? roleLabels[user.role] : ""}</small></span><button className="icon-button signout-button" type="button" aria-label="Barcha qurilmalardan chiqish" title="Barcha qurilmalardan chiqish" onClick={() => void handleLogout()}><LogOut size={16} /></button></div>
      </div>
    </aside>
    <div className="workspace-content"><header className="topbar"><button className="mobile-menu-button icon-button" type="button" aria-label={menuOpen ? "Menyuni yopish" : "Menyuni ochish"} aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}>{menuOpen ? <X size={18} /> : <Menu size={18} />}</button><div className="breadcrumb"><span>Ish maydoni</span><ChevronRight size={14} /><strong>{current?.label ?? "Qurilish CRM"}</strong></div><div className="topbar-user"><span className="online-dot" /> Ma’lumotlar API orqali yangilanadi</div></header><main id="main-content" className="main-content">{children}</main></div>
  </div>;
}
