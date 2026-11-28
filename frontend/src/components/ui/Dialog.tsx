"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

type Props = { open: boolean; onClose: () => void; title: string; description?: string; children: React.ReactNode };

export function Dialog({ open, onClose, title, description, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return <dialog ref={ref} className="dialog" onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === ref.current) onClose(); }}>
    <header className="dialog-header"><div><h2>{title}</h2>{description && <p>{description}</p>}</div><button className="icon-button" type="button" aria-label="Yopish" onClick={onClose}><X size={18} /></button></header>
    {children}
  </dialog>;
}
