"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Panel } from "@/components/ui/Panel";
import { useToast } from "@/components/providers/ToastProvider";
import { useAuth } from "@/features/auth/AuthProvider";
import { LeadTable } from "@/features/leads/LeadTable";
import { confirmSale, listLeads, updateLeadStage } from "@/features/leads/api";
import type { Lead, LeadStage } from "@/lib/api/contracts";
import { stageLabels } from "@/lib/presentation";

const stages: LeadStage[] = ["new", "contacted", "viewing", "won", "lost"];

export function LeadsPage() {
  const { user } = useAuth();
  const showToast = useToast();
  const [rows, setRows] = useState<Lead[]>([]);
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<LeadStage | "">("");
  const [offset, setOffset] = useState(0);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [pendingSale, setPendingSale] = useState<Lead | null>(null);
  const [saleBusy, setSaleBusy] = useState(false);
  const canWrite = Boolean(user?.permissions.includes("leads:write"));
  const searchHint = query.trim().length === 1;

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true); setError(""); setOffset(0);
      void listLeads({ q: query, stage, limit: 50 }).then((result) => {
        if (active) { setRows(result); setMore(result.length === 50); }
      }).catch((reason: unknown) => {
        if (active) { setRows([]); setError(reason instanceof Error ? reason.message : "Arizalar yuklanmadi."); }
      }).finally(() => { if (active) setLoading(false); });
    }, 180);
    return () => { active = false; window.clearTimeout(timer); };
  }, [query, stage]);

  const counts = useMemo(() => stages.map((item) => [item, rows.filter((lead) => lead.stage === item).length] as const), [rows]);

  async function handleStageChange(lead: Lead, next: LeadStage) {
    try {
      const updated = await updateLeadStage(lead.id, next, lead.version);
      setRows((current) => current.map((row) => row.id === updated.id ? updated : row));
      showToast(`Ariza #${lead.id}: ${stageLabels[next]} bosqichi saqlandi.`);
    } catch (reason) {
      showToast(reason instanceof Error ? `${reason.message}. Ma’lumot yangilanmoqda.` : "Bosqich saqlanmadi.", "error");
      if (reason instanceof Error && "status" in reason && (reason as { status: number }).status === 409) reloadCurrent();
    }
  }

  function reloadCurrent() {
    setLoading(true);
    void listLeads({ q: query, stage, limit: 50, offset }).then((result) => { setRows(result); setMore(result.length === 50); }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Arizalar yangilanmadi.")).finally(() => setLoading(false));
  }

  async function loadMore() {
    setLoadingMore(true);
    try {
      const nextOffset = offset + 50;
      const next = await listLeads({ q: query, stage, limit: 50, offset: nextOffset });
      setRows((current) => [...current, ...next]); setOffset(nextOffset); setMore(next.length === 50);
    } catch (reason) { showToast(reason instanceof Error ? reason.message : "Keyingi arizalar yuklanmadi.", "error"); }
    finally { setLoadingMore(false); }
  }

  async function finalizeSale() {
    if (!pendingSale) return;
    setSaleBusy(true);
    try {
      const result = await confirmSale(pendingSale.id, pendingSale.version);
      setRows((current) => current.map((row) => row.id === result.lead.id ? result.lead : row));
      showToast(`Sotuv yakunlandi. Xonadon #${result.apartment.id} sotilgan deb belgilandi.`);
      setPendingSale(null);
    } catch (reason) { showToast(reason instanceof Error ? reason.message : "Sotuv tasdiqlanmadi.", "error"); if (reason instanceof Error && "status" in reason && (reason as { status: number }).status === 409) reloadCurrent(); }
    finally { setSaleBusy(false); }
  }

  return <div className="page">
    <header className="page-head"><div><h1>Arizalar</h1><p>Murojaatni toping, hozirgi bosqichni ko‘ring va ruxsat etilgan keyingi qadamni bajaring.</p></div></header>
    <div className="stage-summary" aria-label="Joriy ro‘yxat bosqichlari">{counts.map(([key, count]) => <button type="button" key={key} className={`stage-filter-chip${stage === key ? " stage-filter-chip--active" : ""}`} onClick={() => setStage((current) => current === key ? "" : key)}><span className={`status-pin status-pin--${key}`} />{stageLabels[key]}<strong>{count}</strong></button>)}</div>
    <Panel className="table-panel"><div className="toolbar"><label className="search-field"><Search size={16} aria-hidden="true" /><input className="control" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ism yoki telefon bo‘yicha qidirish" aria-label="Arizalarni qidirish" /></label><label className="filter-row"><SlidersHorizontal size={15} aria-hidden="true" /><span className="sr-only">Bosqich</span><select className="control" value={stage} onChange={(event) => setStage(event.target.value as LeadStage | "")}><option value="">Barcha bosqichlar</option>{stages.map((item) => <option value={item} key={item}>{stageLabels[item]}</option>)}</select></label><span className="toolbar-count">{rows.length} ta ariza</span></div>
      {searchHint && <p className="toolbar-note">Qidirish uchun kamida 2 ta belgi kiriting; API talabiga ko‘ra qisqa matn bo‘yicha filtr qo‘llanmaydi.</p>}
      {loading ? <LoadingState /> : error ? <div className="error-state"><p>{error}</p><Button variant="secondary" onClick={reloadCurrent}>Qayta yuklash</Button></div> : <>
        <LeadTable leads={rows} canWrite={canWrite} onStageChange={handleStageChange} onConfirmSale={setPendingSale} />
        {more && <div className="pagination"><div><Button variant="secondary" loading={loadingMore} onClick={() => void loadMore()}>Keyingi arizalarni yuklash</Button><p className="pagination-note">50 tadan yuklanadi. Backend umumiy yozuvlar sonini qaytarmaydi.</p></div></div>}
        {!rows.length && !query && !stage && <EmptyState title="Hozircha ariza yo‘q" description="Ochiq katalogdan kelgan murojaatlar shu ro‘yxatda ko‘rinadi." />}
      </>}
    </Panel>
    <Dialog open={Boolean(pendingSale)} onClose={() => !saleBusy && setPendingSale(null)} title="Sotuvni yakunlash" description="Ariza va xonadon holati bir vaqtda saqlanadi.">
      {pendingSale && <div className="dialog-form"><div className="confirm-summary"><strong>{pendingSale.full_name}</strong><span>{pendingSale.phone}</span><span>Xonadon #{pendingSale.apartment_id}</span><span>Ariza: {stageLabels[pendingSale.stage]}</span></div><p className="field-hint">Tasdiqlangach, ariza “Sotuv yakunlandi”, xonadon esa “Sotilgan” holatiga o‘tadi. Amal tarixi yoziladi.</p><div className="form-actions"><Button variant="secondary" onClick={() => setPendingSale(null)} disabled={saleBusy}>Bekor qilish</Button><Button loading={saleBusy} onClick={() => void finalizeSale()}>Sotuvni tasdiqlash</Button></div></div>}
    </Dialog>
  </div>;
}
