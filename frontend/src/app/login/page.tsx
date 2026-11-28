"use client";

import { Suspense } from "react";
import { LoadingState } from "@/components/ui/LoadingState";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { LoginForm } from "@/features/auth/LoginForm";

export default function LoginPage() {
  return <AuthProvider><Suspense fallback={<main className="auth-loading"><LoadingState label="Kirish oynasi ochilmoqda" /></main>}><LoginForm /></Suspense></AuthProvider>;
}
