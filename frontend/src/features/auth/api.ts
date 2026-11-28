import { request, signIn } from "@/lib/api/client";
import type { UserSession } from "@/lib/api/contracts";

export async function login(username: string, password: string): Promise<UserSession> {
  await signIn(username, password);
  return request<UserSession>("/auth/me");
}

export const getCurrentUser = () => request<UserSession>("/auth/me");
