"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { clearStoredSession, hasStoredSession, resumeAccess, signOut } from "@/lib/api/client";
import type { UserSession } from "@/lib/api/contracts";
import { getCurrentUser, login } from "@/features/auth/api";

type AuthState = { user: UserSession | null; status: "loading" | "signed-in" | "signed-out" };
type AuthContextValue = AuthState & { authenticate: (username: string, password: string) => Promise<void>; logout: () => Promise<void> };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, status: "loading" });

  const clearUser = useCallback(() => {
    clearStoredSession();
    setState({ user: null, status: "signed-out" });
  }, []);

  useEffect(() => {
    const onExpired = () => setState({ user: null, status: "signed-out" });
    window.addEventListener("crm:session-expired", onExpired);
    if (!hasStoredSession()) {
      queueMicrotask(() => setState({ user: null, status: "signed-out" }));
    } else {
      void (async () => {
        try {
          if (await resumeAccess()) setState({ user: await getCurrentUser(), status: "signed-in" });
          else setState({ user: null, status: "signed-out" });
        } catch {
          clearUser();
        }
      })();
    }
    return () => window.removeEventListener("crm:session-expired", onExpired);
  }, [clearUser]);

  const authenticate = useCallback(async (username: string, password: string) => {
    const user = await login(username, password);
    setState({ user, status: "signed-in" });
  }, []);

  const logout = useCallback(async () => {
    try { await signOut(); } finally { setState({ user: null, status: "signed-out" }); }
  }, []);

  const value = useMemo(() => ({ ...state, authenticate, logout }), [state, authenticate, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth AuthProvider ichida ishlatilishi kerak");
  return context;
}
