"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Panel } from "@/components/ui/Panel";
import { useToast } from "@/components/providers/ToastProvider";
import { createApartment, createComplex, deleteApartment, deleteComplex, listApartments, listComplexes, updateApartment, updateApartmentPrice, updateComplex } from "@/features/catalog/api";
import type { Apartment, Complex } from "@/lib/api/contracts";
import { availabilityLabels, formatMoney } from "@/lib/presentation";

type CatalogDialog =
  | { kind: "complex"; item?: Complex }
  | { kind: "apartment"; item?: Apartment }
  | { kind: "price"; item: Apartment }
  | { kind: "delete-complex"; item: Complex }
  | { kind: "delete-apartment"; item: Apartment }
  | null;

export function CatalogPage() {
  const showToast = useToast();
  const [complexes, setComplexes] = useState<Complex[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [complexOffset, setComplexOffset] = useState(0);
  const [apartmentOffset, setApartmentOffset] = useState(0);
  const [moreComplexes, setMoreComplexes] = useState(false);
  const [moreApartments, setMoreApartments] = useState(false);
  const [dialog, setDialog] = useState<CatalogDialog>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [complexRows, apartmentRows] = await Promise.all([listComplexes(), listApartments()]);
      setComplexes(complexRows); setApartments(apartmentRows); setComplexOffset(0); setApartmentOffset(0);
      setMoreComplexes(complexRows.length === 100); setMoreApartments(apartmentRows.length === 100);
    } catch (reason) { showToast(reason instanceof Error ? reason.message : "Katalog yuklanmadi.", "error"); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) void refresh(); });
    return () => { active = false; };
  }, [refresh]);

  const complexMap = useMemo(() => new Map(complexes.map((item) => [item.id, item.name])), [complexes]);
  const visibleApartments = apartments.filter((item) => `${item.number} ${complexMap.get(item.complex_id) ?? ""}`.toLocaleLowerCase("uz-Latn").includes(query.trim().toLocaleLowerCase("uz-Latn")));

  async function loadMore() {
    setLoadingMore(true);
    try {
      const [complexRows, apartmentRows] = await Promise.all([
        moreComplexes ? listComplexes(complexOffset + 100) : Promise.resolve([]),
        moreApartments ? listApartments(apartmentOffset + 100) : Promise.resolve([]),
      ]);
      setComplexes((current) => [...current, ...complexRows]); setApartments((current) => [...current, ...apartmentRows]);
      if (moreComplexes) { setComplexOffset((value) => value + 100); setMoreComplexes(complexRows.length === 100); }
      if (moreApartments) { setApartmentOffset((value) => value + 100); setMoreApartments(apartmentRows.length === 100); }
    } catch (reason) { showToast(reason instanceof Error ? reason.message : "Keyingi yozuvlar yuklanmadi.", "error"); }
    finally { setLoadingMore(false); }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!dialog) return;
    const data = new FormData(event.currentTarget);
    setBusy(true);
    try {
      if (dialog.kind === "complex") {
        const name = String(data.get("name") ?? "").trim();
        if (dialog.item) await updateComplex(dialog.item.id, name); else await createComplex(name);
        showToast(dialog.item ? "Majmua nomi yangilandi." : "Majmua yaratildi.");
      } else if (dialog.kind === "apartment") {
        const number = String(data.get("number") ?? "").trim(); const rooms = Number(data.get("rooms"));
        if (dialog.item) await updateApartment(dialog.item.id, { number, rooms });
        else await createApartment({ complex_id: Number(data.get("complex_id")), number, rooms, price_uzs: Number(data.get("price_uzs")) });
        showToast(dialog.item ? "Xonadon ma’lumoti yangilandi." : "Xonadon qo‘shildi.");
      } else if (dialog.kind === "price") {
        await updateApartmentPrice(dialog.item.id, Number(data.get("price_uzs")), dialog.item.price_uzs);
        showToast("Xonadon narxi yangilandi.");
      }
      setDialog(null); await refresh();
    } catch (reason) { showToast(reason instanceof Error ? `${reason.message}. Kiritilgan ma’lumotni tekshiring.` : "Amal bajarilmadi.", "error"); }
    finally { setBusy(false); }
  }

  async function handleDelete() {
    if (!dialog || (dialog.kind !== "delete-complex" && dialog.kind !== "delete-apartment")) return;
    setBusy(true);
    try {
      if (dialog.kind === "delete-complex") { await deleteComplex(dialog.item.id); showToast("Majmua o‘chirildi."); }
      else { await deleteApartment(dialog.item.id); showToast("Xonadon o‘chirildi."); }
      setDialog(null); await refresh();
    } catch (reason) { showToast(reason instanceof Error ? `${reason.message}. Bog‘langan arizalarni yoki xonadon holatini tekshiring.` : "Yozuv o‘chirilmadi.", "error"); }
    finally { setBusy(false); }
  }

  const modalTitle = dialog?.kind === "complex" ? dialog.item ? "Majmuani tahrirlash" : "Yangi majmua" : dialog?.kind === "apartment" ? dialog.item ? "Xonadonni tahrirlash" : "Yangi xonadon" : dialog?.kind === "price" ? "Narxni o‘zgartirish" : dialog?.kind === "delete-complex" ? "Majmuani o‘chirish" : dialog?.kind === "delete-apartment" ? "Xonadonni o‘chirish" : "";
  const deleting = dialog?.kind === "delete-complex" || dialog?.kind === "delete-apartment";

  return <div className="page">
    <header className="page-head"><div><h1>Xonadonlar katalogi</h1><p>Majmua va xonadonlarni tahrirlang, narxni yangilang. Band yoki sotilgan obyektlar o‘chirilmaydi.</p></div><div className="page-actions"><Button variant="secondary" icon={<Plus size={15} />} onClick={() => setDialog({ kind: "complex" })}>Majmua qo‘shish</Button><Button icon={<Plus size={15} />} onClick={() => setDialog({ kind: "apartment" })} disabled={!complexes.length}>Xonadon qo‘shish</Button></div></header>
    <div className="catalog-count-strip"><span><strong>{complexes.length}</strong> ko‘rsatilgan majmua</span><span><strong>{apartments.length}</strong> ko‘rsatilgan xonadon</span><span><strong>{apartments.filter((item) => item.availability === "available").length}</strong> bo‘sh</span></div>
    <Panel className="table-panel"><div className="panel-header"><div><h2>Xonadonlar</h2><p>Narx va mavjudlik holati har bir yozuvda ko‘rsatiladi.</p></div><label className="search-field"><Search size={16} aria-hidden="true" /><input className="control" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Xonadon yoki majmua" aria-label="Katalogdan qidirish" /></label></div>
      {loading ? <LoadingState /> : visibleApartments.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>Xonadon</th><th>Majmua</th><th>Xona</th><th>Narx</th><th>Holat</th><th>Amallar</th></tr></thead><tbody>{visibleApartments.map((item) => <tr key={item.id}><td><strong>{item.number}-xonadon</strong><small className="table-sub">#{item.id}</small></td><td>{complexMap.get(item.complex_id) ?? `Majmua #${item.complex_id}`}</td><td>{item.rooms} xona</td><td>{formatMoney(item.price_uzs)}</td><td><span className={`status-badge status-badge--${item.availability}`}>{availabilityLabels[item.availability]}</span></td><td><div className="table-actions"><Button variant="quiet" size="small" icon={<Pencil size={14} />} aria-label={`${item.number}-xonadonni tahrirlash`} disabled={item.availability !== "available"} onClick={() => setDialog({ kind: "apartment", item })}>Tahrirlash</Button><Button variant="quiet" size="small" icon={<span className="sr-only">O‘chirish</span>} aria-label={`${item.number}-xonadonni o‘chirish`} disabled={item.availability !== "available"} onClick={() => setDialog({ kind: "delete-apartment", item })}><Trash2 size={14} /></Button><Button variant="secondary" size="small" disabled={item.availability !== "available"} onClick={() => setDialog({ kind: "price", item })}>Narx</Button></div></td></tr>)}</tbody></table></div> : <EmptyState title="Xonadon topilmadi" description={query ? "Qidiruv so‘zini o‘zgartirib ko‘ring." : "Yangi xonadon qo‘shish uchun avval majmua yarating."} />}
      {!loading && (moreApartments || moreComplexes) && <div className="pagination"><Button variant="secondary" loading={loadingMore} onClick={() => void loadMore()}>Keyingi katalog yozuvlari</Button></div>}
    </Panel>
    <section className="complex-section"><div className="section-head"><div><h2>Turar joy majmualari</h2><p>Majmua nomini yangilash yoki bo‘sh majmuani o‘chirish mumkin.</p></div></div><Panel className="complex-panel">{loading ? <LoadingState /> : complexes.length ? <div className="complex-list">{complexes.map((complex) => <div className="complex-row" key={complex.id}><span className="complex-icon"><Building2 size={17} /></span><span className="complex-name"><strong>{complex.name}</strong><small>{apartments.filter((item) => item.complex_id === complex.id).length} ta yuklangan xonadon</small></span><span className="complex-actions"><Button variant="quiet" size="small" icon={<Pencil size={14} />} aria-label={`${complex.name} nomini tahrirlash`} onClick={() => setDialog({ kind: "complex", item: complex })}>Tahrirlash</Button><Button variant="quiet" size="small" aria-label={`${complex.name} majmuasini o‘chirish`} onClick={() => setDialog({ kind: "delete-complex", item: complex })}><Trash2 size={14} /></Button></span></div>)}</div> : <EmptyState title="Majmua yo‘q" description="Birinchi xonadonlarni kiritish uchun majmua yarating." />}</Panel></section>

    <Dialog open={Boolean(dialog)} onClose={() => !busy && setDialog(null)} title={modalTitle} description={dialog?.kind.includes("delete") ? "Bu amal audit tarixiga yoziladi. Bog‘langan yozuv bo‘lsa, server o‘chirishni rad etadi." : "O‘zgarishlar kompaniya katalogiga saqlanadi."}>
      {dialog && deleting ? <div className="dialog-form"><p className="confirm-copy">{dialog.kind === "delete-complex" ? `“${dialog.item.name}” majmuasini o‘chirish so‘rovi yuboriladi.` : `${dialog.item.number}-xonadon o‘chiriladi.`}</p><div className="form-actions"><Button variant="secondary" onClick={() => setDialog(null)} disabled={busy}>Bekor qilish</Button><Button variant="danger" loading={busy} onClick={() => void handleDelete()}>O‘chirish</Button></div></div> : dialog && <form className="dialog-form" onSubmit={(event) => void handleSubmit(event)}>
        {dialog.kind === "complex" && <div className="field"><label htmlFor="complex-name">Majmua nomi</label><input id="complex-name" name="name" required minLength={2} maxLength={120} defaultValue={dialog.item?.name ?? ""} placeholder="Masalan, Bog‘ishamol turar joy majmuasi" /></div>}
        {dialog.kind === "apartment" && <div className="form-grid">
          {!dialog.item && <div className="field field--full"><label htmlFor="complex-id">Turar joy majmuasi</label><select id="complex-id" name="complex_id" required defaultValue=""><option value="" disabled>Majmuani tanlang</option>{complexes.map((complex) => <option value={complex.id} key={complex.id}>{complex.name}</option>)}</select></div>}
          <div className="field"><label htmlFor="apartment-number">Xonadon raqami</label><input id="apartment-number" name="number" required maxLength={30} defaultValue={dialog.item?.number ?? ""} /></div>
          <div className="field"><label htmlFor="apartment-rooms">Xonalar soni</label><input id="apartment-rooms" name="rooms" type="number" min={1} max={10} required defaultValue={dialog.item?.rooms ?? 1} /></div>
          {!dialog.item && <div className="field field--full"><label htmlFor="apartment-price">Boshlang‘ich narx (so‘m)</label><input id="apartment-price" name="price_uzs" type="number" min={1} max={1_000_000_000_000_000} required /></div>}
          {dialog.item && <p className="field-hint field--full">Bo‘sh xonadonning raqami va xona soni tahrirlanadi. Narx alohida amal bilan o‘zgartiriladi.</p>}
        </div>}
        {dialog.kind === "price" && <div className="field"><label htmlFor="new-price">Yangi narx (so‘m)</label><input id="new-price" name="price_uzs" type="number" min={1} max={1_000_000_000_000_000} required defaultValue={dialog.item.price_uzs} /><p className="field-hint">Joriy narx: {formatMoney(dialog.item.price_uzs)}. O‘zgarish mavjud narx bilan tekshiriladi va auditga yoziladi.</p></div>}
        <div className="form-actions"><Button variant="secondary" type="button" onClick={() => setDialog(null)} disabled={busy}>Bekor qilish</Button><Button loading={busy}>{dialog.kind === "price" ? "Narxni saqlash" : dialog.item ? "O‘zgarishlarni saqlash" : "Yaratish"}</Button></div>
      </form>}
    </Dialog>
  </div>;
}
