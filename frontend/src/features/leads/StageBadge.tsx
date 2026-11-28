import type { LeadStage } from "@/lib/api/contracts";
import { stageLabels } from "@/lib/presentation";

export function StageBadge({ stage }: { stage: LeadStage }) {
  return <span className={`status-badge status-badge--${stage}`}>{stageLabels[stage]}</span>;
}
