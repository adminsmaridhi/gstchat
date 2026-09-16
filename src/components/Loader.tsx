export function Spinner({ className = "h-5 w-5 border-2" }: { className?: string }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-emerald-600 border-t-transparent ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export default function Loader({ label, className = "" }: { label?: string; className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Spinner className="h-6 w-6 border-2" />
      {label && <span className="text-sm text-slate-500">{label}</span>}
    </div>
  );
}