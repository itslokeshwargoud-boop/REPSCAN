export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-5 animate-pulse ${className}`}>
      <div className="h-3 bg-gray-200 rounded w-1/3 mb-3" />
      <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-1/4" />
    </div>
  );
}

export function SkeletonRHICard() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-8 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/4 mb-6" />
      <div className="flex items-end gap-4 mb-4">
        <div className="h-16 bg-gray-200 rounded w-32" />
        <div className="h-6 bg-gray-100 rounded w-16" />
      </div>
      <div className="h-3 bg-gray-100 rounded w-3/4" />
    </div>
  );
}

export function SkeletonMetricGrid() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
