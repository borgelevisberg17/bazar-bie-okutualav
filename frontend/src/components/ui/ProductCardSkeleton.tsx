import { Skeleton } from "./skeleton";

interface ProductCardSkeletonProps {
  compact?: boolean;
}

export function ProductCardSkeleton({ compact = false }: ProductCardSkeletonProps) {
  if (compact) {
    return (
      <div className="relative group">
        <Skeleton className="aspect-square w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden border-0 md:border md:border-border/50 bg-card rounded-none md:rounded-lg">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>

      {/* Image */}
      <Skeleton className="aspect-square w-full" />

      {/* Actions */}
      <div className="flex items-center px-2 py-2 gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      {/* Content */}
      <div className="px-3 pb-3 space-y-2">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 6, compact = false }: { count?: number; compact?: boolean }) {
  if (compact) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-4 px-0 md:px-4">
        {Array.from({ length: count }).map((_, i) => (
          <ProductCardSkeleton key={i} compact />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-0 md:space-y-4 md:px-4 md:max-w-[600px] md:mx-auto">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function FeaturedProductsSkeleton() {
  return (
    <div className="py-4">
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-5 w-28" />
        </div>
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-32">
            <Skeleton className="aspect-square rounded-lg mb-1.5" />
            <Skeleton className="h-3 w-16 mb-1" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <Skeleton className="h-32 md:h-48 w-full" />
      <div className="max-w-2xl mx-auto px-4 md:px-6">
        <div className="relative -mt-16 md:-mt-20 mb-4">
          <Skeleton className="h-28 w-28 md:h-36 md:w-36 rounded-full ring-4 ring-background" />
        </div>
        <div className="space-y-2 mb-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-16 w-full mb-4" />
        <div className="flex gap-6 py-4 border-y border-border mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <Skeleton className="h-6 w-12 mx-auto mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function CategoryStoriesSkeleton() {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <Skeleton className="w-16 h-16 rounded-full" />
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}