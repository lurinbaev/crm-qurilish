import { request } from "@/lib/api/client";
import type { Apartment, Complex } from "@/lib/api/contracts";

export const listComplexes = (offset = 0) => request<Complex[]>(`/crm/catalog/complexes?limit=100&offset=${offset}`);
export const createComplex = (name: string) => request<Complex>("/crm/catalog/complexes", { method: "POST", body: { name } });
export const updateComplex = (id: number, name: string) => request<Complex>(`/crm/catalog/complexes/${id}`, { method: "PUT", body: { name } });
export const deleteComplex = (id: number) => request<null>(`/crm/catalog/complexes/${id}`, { method: "DELETE" });

export const listApartments = (offset = 0) => request<Apartment[]>(`/crm/catalog/apartments?limit=100&offset=${offset}`);
export const createApartment = (data: Pick<Apartment, "complex_id" | "number" | "rooms" | "price_uzs">) =>
  request<Apartment>("/crm/catalog/apartments", { method: "POST", body: data });
export const updateApartment = (id: number, data: Partial<Pick<Apartment, "number" | "rooms">>) =>
  request<Apartment>(`/crm/catalog/apartments/${id}`, { method: "PATCH", body: data });
export const deleteApartment = (id: number) => request<null>(`/crm/catalog/apartments/${id}`, { method: "DELETE" });
export const updateApartmentPrice = (id: number, price_uzs: number, expected_price_uzs: number) =>
  request<Apartment>(`/crm/inventory/apartments/${id}/price`, { method: "PATCH", body: { price_uzs, expected_price_uzs } });
