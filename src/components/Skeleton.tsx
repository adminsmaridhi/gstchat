export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-md bg-slate-200/80 ${className}`} />
  );
}

export function Skeletons({ items = 3, className = "h-3" }: { items?: number; className?: string }) {
  return (
    <>
      {Array.from({ length: items }).map((_, i) => (
        <Skeleton key={i} className={className} />
      ))}
    </>
  );
}