import { request } from "@/lib/api/client";
import type { Apartment, Complex, PublicLeadReceipt } from "@/lib/api/contracts";

const companySlug = process.env.NEXT_PUBLIC_COMPANY_SLUG ?? "sinov-qurilish";

export const getPublicComplexes = () => request<Complex[]>(`/companies/${encodeURIComponent(companySlug)}/majmualar`, { auth: false });
export const getPublicApartments = (filters: { complexId?: number; rooms?: number } = {}) => {
  const params = new URLSearchParams({ limit: "100" });
  if (filters.complexId) params.set("complex_id", String(filters.complexId));
  if (filters.rooms) params.set("rooms", String(filters.rooms));
  return request<Apartment[]>(`/companies/${encodeURIComponent(companySlug)}/kvartiralar?${params}`, { auth: false });
};
export const submitPublicLead = (data: { full_name: string; phone: string; apartment_id: number; consent: true }) =>
  request<PublicLeadReceipt>(`/companies/${encodeURIComponent(companySlug)}/arizalar`, { method: "POST", body: data, auth: false });
