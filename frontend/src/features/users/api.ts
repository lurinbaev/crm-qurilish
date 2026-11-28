import { request } from "@/lib/api/client";
import type { Role, StaffUser } from "@/lib/api/contracts";

export const listUsers = () => request<StaffUser[]>("/crm/users?limit=100");
export const createUser = (data: { username: string; password: string; role: Extract<Role, "seller" | "viewer"> }) =>
  request<StaffUser>("/crm/users", { method: "POST", body: data });
export const deactivateUser = (id: number) => request<null>(`/crm/users/${id}/deactivate`, { method: "POST" });
