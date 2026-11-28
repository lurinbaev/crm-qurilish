"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell } from "@/components/workspace/AppShell";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuth } from "@/features/auth/AuthProvider";

export function WorkspaceGate({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "signed-out") router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    if (status === "signed-in" && user?.role !== "admin" && ["/inventory", "/team", "/audit"].includes(pathname)) router.replace("/");
  }, [pathname, router, status, user?.role]);

  if (status !== "signed-in" || !user) return <main className="auth-loading"><LoadingState label="Ish maydoni tekshirilmoqda" /></main>;
  if (user.role !== "admin" && ["/inventory", "/team", "/audit"].includes(pathname)) return <main className="auth-loading"><LoadingState label="Ruxsat tekshirilmoqda" /></main>;
  return <AppShell>{children}</AppShell>;
}
