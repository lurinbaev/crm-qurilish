import type { Lead, LeadStage } from "@/lib/api/contracts";

export const stageLabels: Record<LeadStage, string> = {
  new: "Yangi",
  contacted: "Bog‘lanildi",
  viewing: "Ko‘rik belgilandi",
  won: "Sotuv yakunlandi",
  lost: "Yopildi",
};

export const stageChoices: Record<LeadStage, LeadStage[]> = {
  new: ["contacted", "lost"],
  contacted: ["viewing", "lost"],
  viewing: ["lost"],
  won: [],
  lost: [],
};

export const availabilityLabels = { available: "Bo‘sh", reserved: "Bron qilingan", sold: "Sotilgan" } as const;
export const roleLabels = { admin: "Administrator", seller: "Sotuv menejeri", viewer: "Kuzatuvchi" } as const;
export const formatMoney = (value: number) => `${new Intl.NumberFormat("uz-UZ").format(value)} so‘m`;
export const formatDate = (value: string) => new Intl.DateTimeFormat("uz-UZ", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
export const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase("uz-Latn");

export function isActionableLead(lead: Lead): boolean {
  return lead.stage === "viewing";
}
