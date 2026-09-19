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

export function PlanCardSkeleton() {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-14 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-4 w-24" />
      <div className="mt-5 flex items-baseline gap-1.5">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-4 w-12" />
      </div>
      <div className="mt-5 space-y-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-3.5 flex-1" />
          </div>
        ))}
      </div>
      <Skeleton className="mt-6 h-10 w-full" />
    </div>
  );
}