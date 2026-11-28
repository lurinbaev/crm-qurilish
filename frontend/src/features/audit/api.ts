import { request } from "@/lib/api/client";
import type { AuditRecord } from "@/lib/api/contracts";

export const listAudit = (limit = 100) => request<AuditRecord[]>(`/crm/audit?limit=${limit}`);
