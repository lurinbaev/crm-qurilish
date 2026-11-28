export function LoadingState({ label = "Ma’lumotlar yuklanmoqda" }: { label?: string }) {
  return <div className="loading-state" role="status"><span className="loader-dot" aria-hidden="true" />{label}</div>;
}
