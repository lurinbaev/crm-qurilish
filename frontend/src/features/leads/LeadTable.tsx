"use client";

import type { Lead, LeadStage } from "@/lib/api/contracts";
import { initials, stageChoices } from "@/lib/presentation";
import { EmptyState } from "@/components/ui/EmptyState";
import { StageBadge } from "@/features/leads/StageBadge";

type Props = {
  leads: Lead[];
  canWrite: boolean;
  onStageChange: (lead: Lead, stage: LeadStage) => void;
  onConfirmSale: (lead: Lead) => void;
};

export function LeadTable({ leads, canWrite, onStageChange, onConfirmSale }: Props) {
  if (!leads.length) return <EmptyState title="Arizalar topilmadi" description="Filtrlarni o‘zgartirib ko‘ring yoki yangi murojaat kelishini kuting." />;

  return <div className="table-scroll"><table className="data-table"><thead><tr><th>Mijoz</th><th>Xonadon</th><th>Bosqich</th><th>Manba</th><th><span className="sr-only">Amallar</span></th></tr></thead><tbody>
    {leads.map((lead) => <tr key={lead.id}>
      <td><div className="person"><span className="avatar" aria-hidden="true">{initials(lead.full_name)}</span><span><strong>{lead.full_name}</strong><small>{lead.phone} · #{lead.id}</small></span></div></td>
      <td><span>Xonadon #{lead.apartment_id}</span></td>
      <td><div className="lead-status-cell"><StageBadge stage={lead.stage} />{canWrite && stageChoices[lead.stage].length > 0 && <label className="sr-only" htmlFor={`stage-${lead.id}`}>Ariza #{lead.id} bosqichini o‘zgartirish</label>}</div></td>
      <td>{lead.source ?? "—"}</td>
      <td><div className="table-actions">
        {canWrite && stageChoices[lead.stage].length > 0 && <select id={`stage-${lead.id}`} className="status-select" value="" onChange={(event) => { if (event.target.value) onStageChange(lead, event.target.value as LeadStage); }} aria-label={`Ariza #${lead.id} bosqichini o‘zgartirish`}><option value="">Bosqichni o‘zgartirish</option>{stageChoices[lead.stage].map((stage) => <option value={stage} key={stage}>{stage === "lost" ? "Yopish" : stage === "contacted" ? "Bog‘lanildi" : "Ko‘rik belgilash"}</option>)}</select>}
        {canWrite && lead.stage === "viewing" && <button className="button button--small button--primary" type="button" onClick={() => onConfirmSale(lead)}>Sotuvni yakunlash</button>}
      </div></td>
    </tr>)}
  </tbody></table></div>;
}
