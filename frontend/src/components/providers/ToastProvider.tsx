"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CircleCheck, CircleX, X } from "lucide-react";

type ToastItem = { id: number; message: string; kind: "success" | "error" };
type ToastContextValue = { showToast: (message: string, kind?: ToastItem["kind"]) => void };
const ToastContext = createContext<ToastContextValue | null>(null);
let nextToastId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const dismiss = useCallback((id: number) => setItems((current) => current.filter((item) => item.id !== id)), []);
  const showToast = useCallback((message: string, kind: ToastItem["kind"] = "success") => {
    const id = nextToastId++;
    setItems((current) => [...current, { id, message, kind }]);
    window.setTimeout(() => dismiss(id), 5000);
  }, [dismiss]);
  const value = useMemo(() => ({ showToast }), [showToast]);

  return <ToastContext.Provider value={value}>
    {children}
    <div className="toast-stack" aria-live="polite" aria-atomic="false">
      {items.map((item) => <div className={`toast toast--${item.kind}`} key={item.id} role={item.kind === "error" ? "alert" : "status"}>
        {item.kind === "error" ? <CircleX size={18} aria-hidden="true" /> : <CircleCheck size={18} aria-hidden="true" />}
        <span>{item.message}</span><button type="button" onClick={() => dismiss(item.id)} aria-label="Xabarni yopish"><X size={16} /></button>
      </div>)}
    </div>
  </ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast ToastProvider ichida ishlatilishi kerak");
  return context.showToast;
}
