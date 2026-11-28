import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quiet" | "danger";
  size?: "normal" | "small";
  loading?: boolean;
  icon?: ReactNode;
};

export function Button({ variant = "primary", size = "normal", loading = false, icon, children, className = "", disabled, ...props }: Props) {
  return <button className={`button button--${variant} button--${size} ${className}`} disabled={disabled || loading} {...props}>
    {loading ? <LoaderCircle size={16} className="spin" aria-hidden="true" /> : icon}
    <span>{children}</span>
  </button>;
}
