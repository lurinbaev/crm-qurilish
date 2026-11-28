import type { Metadata } from "next";
import { ToastProvider } from "@/components/providers/ToastProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Qurilish CRM", template: "%s · Qurilish CRM" },
  description: "Qurilish kompaniyasining savdo arizalari va xonadon katalogi.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="uz-Latn"><body><ToastProvider>{children}</ToastProvider></body></html>;
}
