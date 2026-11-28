"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2, Filter, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Panel } from "@/components/ui/Panel";
import { useToast } from "@/components/providers/ToastProvider";
import { getPublicApartments, getPublicComplexes, submitPublicLead } from "@/features/public-catalog/api";
import type { Apartment, Complex } from "@/lib/api/contracts";
import { availabilityLabels, formatMoney } from "@/lib/presentation";

export function PublicCatalogPage() {
  const showToast = useToast();
  const [complexes, setComplexes] = useState<Complex[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [complexId, setComplexId] = useState("");
  const [rooms, setRooms] = useState("");
  const [loading, setLoading] = useState(true);
  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [submittedId, setSubmittedId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void getPublicComplexes().then((items) => { if (active) setComplexes(items); }).catch((reason: unknown) => showToast(reason instanceof Error ? reason.message : "Katalog yuklanmadi.", "error")).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [showToast]);

  useEffect(() => {
    let active = true;
    void getPublicApartments({ complexId: complexId ? Number(complexId) : undefined, rooms: rooms ? Number(rooms) : undefined }).then((items) => { if (active) setApartments(items); }).catch((reason: unknown) => showToast(reason instanceof Error ? reason.message : "Xonadonlar yuklanmadi.", "error")).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [complexId, rooms, showToast]);

  const available = useMemo(() => apartments.filter((item) => item.availability === "available"), [apartments]);

  async function sendLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!apartment) return;
    const data = new FormData(event.currentTarget); setBusy(true);
    try {
      const receipt = await submitPublicLead({ full_name: String(data.get("full_name")).trim(), phone: String(data.get("phone")).trim(), apartment_id: apartment.id, consent: true });
      setSubmittedId(receipt.id); setApartment(null); showToast(`Murojaatingiz qabul qilindi. Ariza raqami #${receipt.id}.`);
    } catch (reason) { showToast(reason instanceof Error ? reason.message : "Murojaat yuborilmadi.", "error"); }
    finally { setBusy(false); }
  }

  return <main className="public-catalog"><header className="public-header"><a className="brand" href="/catalog"><span className="brand-mark"><Building2 size={18} /></span><span><strong>Qurilish CRM</strong><small>Xonadonlar katalogi</small></span></a><a className="button button--secondary" href="/login">Xodimlar uchun</a></header>
    <section className="public-intro"><div><h1>Bo‘sh xonadonlarni ko‘ring</h1><p>Majmua va xona sonini tanlang. Qiziqqan xonadoningiz bo‘yicha murojaat qoldiring.</p></div><span className="public-count"><strong>{available.length}</strong> bo‘sh xonadon</span></section>
    <Panel className="public-filters"><Filter size={16} /><label><span>Turar joy majmuasi</span><select className="control" value={complexId} onChange={(event) => { setLoading(true); setComplexId(event.target.value); }}><option value="">Barcha majmualar</option>{complexes.map((complex) => <option value={complex.id} key={complex.id}>{complex.name}</option>)}</select></label><label><span>Xonalar soni</span><select className="control" value={rooms} onChange={(event) => { setLoading(true); setRooms(event.target.value); }}><option value="">Barchasi</option>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value} xona</option>)}</select></label></Panel>
    {loading ? <LoadingState label="Xonadonlar yuklanmoqda" /> : available.length ? <section className="public-apartment-list" aria-label="Bo‘sh xonadonlar">{available.map((item) => <article className="public-apartment glass-panel" key={item.id}><div className="public-apartment-mark"><Building2 size={19} /></div><div className="public-apartment-title"><p>{complexes.find((complex) => complex.id === item.complex_id)?.name ?? `Majmua #${item.complex_id}`}</p><h2>{item.number}-xonadon</h2><span>{item.rooms} xona · {availabilityLabels[item.availability]}</span></div><strong className="public-price">{formatMoney(item.price_uzs)}</strong><Button onClick={() => { setSubmittedId(null); setApartment(item); }}>Murojaat qoldirish <Send size={14} /></Button></article>)}</section> : <EmptyState title="Mos bo‘sh xonadon yo‘q" description="Filtrlarni o‘zgartiring yoki keyinroq qayta tekshiring." />}
    <footer className="public-footer">Xonadon holati va narxlar API katalogidan olinadi. Yuborilgan murojaat xodimlar CRM navbatiga tushadi.</footer>

    <Dialog open={Boolean(apartment)} onClose={() => !busy && setApartment(null)} title="Xonadon bo‘yicha murojaat" description={apartment ? `${complexes.find((complex) => complex.id === apartment.complex_id)?.name ?? "Turar joy majmuasi"} · ${apartment.number}-xonadon` : ""}>
      {submittedId ? <div className="success-receipt"><span><CheckCircle2 size={24} /></span><h3>Murojaat qabul qilindi</h3><p>Ariza raqami: <strong>#{submittedId}</strong>. Sotuv menejeri murojaatingizni ko‘rib chiqadi.</p><Button variant="secondary" onClick={() => setSubmittedId(null)}>Yana murojaat yuborish</Button></div> : apartment && <form className="dialog-form" onSubmit={(event) => void sendLead(event)}><div className="field"><label htmlFor="visitor-name">Ism va familiya</label><input id="visitor-name" name="full_name" required minLength={2} maxLength={80} autoComplete="name" placeholder="Masalan, Dilnoza Rahimova" /></div><div className="field"><label htmlFor="visitor-phone">Telefon raqami</label><input id="visitor-phone" name="phone" type="tel" inputMode="tel" pattern="\+998[0-9]{9}" required placeholder="+998901234567" autoComplete="tel" /><p className="field-hint">+998 bilan, jami 13 belgi.</p></div><label className="checkbox-row"><input name="consent" type="checkbox" required /><span>Ushbu murojaatni yuborish uchun telefon raqamimdan foydalanishga roziman.</span></label><div className="form-actions"><Button variant="secondary" type="button" onClick={() => setApartment(null)} disabled={busy}>Bekor qilish</Button><Button loading={busy}>Murojaat yuborish</Button></div></form>}
    </Dialog>
  </main>;
}
