"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Building2, CheckCheck, Clock3, ClipboardList, UserRoundPlus } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuth } from "@/features/auth/AuthProvider";
import { listLeads } from "@/features/leads/api";
import { listApartments } from "@/features/catalog/api";
import { LeadTable } from "@/features/leads/LeadTable";
import { isActionableLead, stageLabels } from "@/lib/presentation";
import type { Apartment, Lead, LeadStage } from "@/lib/api/contracts";
import { useToast } from "@/components/providers/ToastProvider";

const today = new Intl.DateTimeFormat("uz-UZ", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

export function DashboardPage() {
  const { user } = useAuth();
  const showToast = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saleLead, setSaleLead] = useState<Lead | null>(null);
  const [saleBusy, setSaleBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [leadRows, apartmentRows] = await Promise.all([
          listLeads({ limit: 50 }),
          user?.role === "admin" ? listApartments() : Promise.resolve([]),
        ]);
        if (active) { setLeads(leadRows); setApartments(apartmentRows); }
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : "Arizalar yuklanmadi.");
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [user?.role]);

  const totals = (stage: LeadStage) => leads.filter((lead) => lead.stage === stage).length;
  const available = apartments.filter((item) => item.availability === "available").length;

  async function changeStage(lead: Lead, stage: LeadStage) {
    try {
      const { updateLeadStage } = await import("@/features/leads/api");
      const updated = await updateLeadStage(lead.id, stage, lead.version);
      setLeads((current) => current.map((item) => item.id === updated.id ? updated : item));
      showToast(`Ariza #${lead.id}: ${stageLabels[stage]} bosqichi saqlandi.`);
    } catch (reason) { showToast(reason instanceof Error ? reason.message : "Bosqich yangilanmadi.", "error"); }
  }

  async function confirm() {
    if (!saleLead) return;
    setSaleBusy(true);
    try {
      const { confirmSale } = await import("@/features/leads/api");
      const result = await confirmSale(saleLead.id, saleLead.version);
      setLeads((current) => current.map((item) => item.id === result.lead.id ? result.lead : item));
      showToast(`Sotuv yakunlandi. Xonadon #${result.apartment.id} sotilgan deb belgilandi.`);
      setSaleLead(null);
    } catch (reason) { showToast(reason instanceof Error ? reason.message : "Sotuv tasdiqlanmadi.", "error"); }
    finally { setSaleBusy(false); }
  }

  return <div className="page">
    <header className="page-head"><div><h1>Umumiy ko‘rinish</h1><p>{today}. Savdo navbati va katalog holatini bir joyda kuzating.</p></div><Link className="button button--secondary" href="/leads"><ClipboardList size={15} /> Arizalarni ochish</Link></header>
    <section className="metric-strip" aria-label="So‘nggi 50 ariza ko‘rsatkichlari">
      <div className="metric"><span className="metric-icon"><ClipboardList size={17} /></span><div><strong>{loading ? "—" : leads.length}</strong><span>So‘nggi yuklangan ariza</span></div></div>
      <div className="metric"><span className="metric-icon"><UserRoundPlus size={17} /></span><div><strong>{loading ? "—" : totals("new")}</strong><span>Yangi murojaatlar</span></div></div>
      <div className="metric"><span className="metric-icon"><Clock3 size={17} /></span><div><strong>{loading ? "—" : totals("contacted") + totals("viewing")}</strong><span>Jarayondagi arizalar</span></div></div>
      <div className="metric"><span className="metric-icon"><CheckCheck size={17} /></span><div><strong>{loading ? "—" : totals("won")}</strong><span>Yakunlangan sotuv</span></div></div>
    </section>
    {error ? <Panel className="error-panel"><strong>Ma’lumotlar yuklanmadi</strong><p>{error}</p><button type="button" className="button button--secondary" onClick={() => window.location.reload()}>Qayta yuklash</button></Panel> : <div className="dashboard-grid">
      <Panel className="dashboard-panel"><div className="panel-header"><div><h2>Davom etayotgan arizalar</h2><p>Oxirgi 50 ta yozuv ichidan ochiq holatlar</p></div><Link className="inline-link" href="/leads">Barchasini ko‘rish <ArrowUpRight size={14} /></Link></div>
        {loading ? <LoadingState /> : <LeadTable leads={leads.filter(isActionableLead).slice(0, 8)} canWrite={Boolean(user?.permissions.includes("leads:write"))} onStageChange={changeStage} onConfirmSale={setSaleLead} />}
      </Panel>
      <div className="dashboard-side">
        {user?.role === "admin" ? <Panel className="dashboard-panel"><div className="panel-header"><div><h2>Xonadonlar</h2><p>Joriy katalog holati</p></div><Building2 size={18} color="var(--accent)" /></div>{loading ? <LoadingState /> : <div className="inventory-summary"><strong>{available}</strong><span>bo‘sh xonadon</span><small>So‘nggi yuklangan {apartments.length} ta yozuv</small><Link className="button button--secondary" href="/inventory">Katalogni boshqarish <ArrowUpRight size={14} /></Link></div>}</Panel> : <Panel className="dashboard-panel"><div className="panel-header"><div><h2>Ish navbati</h2><p>Arizalarni quyidagi tartibda yuriting</p></div></div><div className="step-list"><div><span>1</span><p><strong>Mijoz bilan bog‘laning</strong><small>Yangi murojaatni ko‘rib chiqing</small></p></div><div><span>2</span><p><strong>Ko‘rikni belgilang</strong><small>Xonadonni ko‘rsatish vaqtini kelishing</small></p></div><div><span>3</span><p><strong>Sotuvni tasdiqlang</strong><small>Ko‘rik bosqichidan keyin</small></p></div></div></Panel>}
        <Panel className="quick-panel"><span>Ochiq katalog</span><p>Xonadonlarni mijozlar uchun ko‘rish</p><Link href="/catalog">Katalogni ochish <ArrowUpRight size={14} /></Link></Panel>
      </div>
    </div>}
    <Dialog open={Boolean(saleLead)} onClose={() => !saleBusy && setSaleLead(null)} title="Sotuvni yakunlash" description="Ariza va xonadon holati bir vaqtda yangilanadi.">
      {saleLead && <div className="dialog-form"><p className="confirm-copy"><strong>{saleLead.full_name}</strong> uchun #{saleLead.apartment_id}-xonadon sotuvini tasdiqlaysizmi? Bu amal audit tarixiga yoziladi.</p><div className="form-actions"><Button variant="secondary" onClick={() => setSaleLead(null)} disabled={saleBusy}>Bekor qilish</Button><Button loading={saleBusy} onClick={() => void confirm()}>Sotuvni yakunlash</Button></div></div>}
    </Dialog>
  </div>;
}
