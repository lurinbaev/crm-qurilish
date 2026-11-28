"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Panel } from "@/components/ui/Panel";
import { useToast } from "@/components/providers/ToastProvider";
import { listAudit } from "@/features/audit/api";
import type { AuditRecord } from "@/lib/api/contracts";
import { formatDate } from "@/lib/presentation";

export function AuditPage() {
  const showToast = useToast();
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  useEffect(() => {
    let active = true;
    void listAudit(100).then((items) => { if (active) setRecords(items); }).catch((reason: unknown) => showToast(reason instanceof Error ? reason.message : "Audit tarixi yuklanmadi.", "error")).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [showToast]);

  const filtered = useMemo(() => records.filter((item) => `${item.action} ${item.actor_id} ${item.resource_id}`.toLowerCase().includes(query.trim().toLowerCase())), [records, query]);

  return <div className="page"><header className="page-head"><div><h1>Amallar tarixi</h1><p>Katalog, narx, sotuv va xodimlar bo‘yicha so‘nggi qaydlar. Yozuvlar API’dan o‘qiladi.</p></div></header>
    <Panel className="table-panel"><div className="toolbar"><label className="search-field"><Search size={16} aria-hidden="true" /><input className="control" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Amal yoki obyekt raqami" aria-label="Audit yozuvlarini qidirish" /></label><span className="toolbar-count">So‘nggi {records.length} ta yozuv</span></div>
      {loading ? <LoadingState /> : filtered.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>Vaqt</th><th>Bajargan xodim</th><th>Amal</th><th>Obyekt</th></tr></thead><tbody>{filtered.map((record) => <tr key={record.id}><td>{formatDate(record.created_at)}</td><td>Xodim #{record.actor_id}</td><td><span className="audit-action">{record.action}</span></td><td>#{record.resource_id}</td></tr>)}</tbody></table></div> : <EmptyState title="Audit yozuvi topilmadi" description={query ? "Qidiruv matnini o‘zgartirib ko‘ring." : "Yangi amallar bajarilganda shu yerda ko‘rinadi."} />}
      <p className="audit-limit-note">Backend API audit tarixi uchun 100 ta yozuv bilan cheklangan.</p>
    </Panel>
  </div>;
}
