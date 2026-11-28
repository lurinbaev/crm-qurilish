import { request } from "@/lib/api/client";
import type { Lead, LeadStage, SaleConfirmation } from "@/lib/api/contracts";

export type LeadQuery = { q?: string; stage?: LeadStage | ""; limit?: number; offset?: number };

export function listLeads({ q = "", stage = "", limit = 50, offset = 0 }: LeadQuery = {}) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (q.trim().length >= 2) params.set("q", q.trim());
  if (stage) params.set("stage", stage);
  return request<Lead[]>(`/crm/arizalar?${params}`);
}

export const getLead = (id: number) => request<Lead>(`/crm/arizalar/${id}`);

export const updateLeadStage = (id: number, stage: LeadStage, expected_version: number) =>
  request<Lead>(`/crm/arizalar/${id}/stage`, { method: "PATCH", body: { stage, expected_version } });

export const confirmSale = (id: number, expected_version: number) =>
  request<SaleConfirmation>(`/crm/arizalar/${id}/sale/confirm`, { method: "POST", body: { expected_version } });
