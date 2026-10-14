'use client';

import { SkeletonCard, SkeletonEventRow, SkeletonLine, SkeletonCircle } from '@/components/loading-skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Header Skeleton */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <SkeletonLine width="w-48" height="h-6" />
              <SkeletonLine width="w-32" height="h-3" />
            </div>
            <SkeletonCircle size="w-10 h-10" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Balance Summary Skeleton */}
        <SkeletonCard className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <div className="space-y-4">
            <SkeletonLine width="w-32" height="h-4" />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <SkeletonLine width="w-20" height="h-3" />
                <SkeletonLine width="w-24" height="h-5" />
              </div>
              <div className="space-y-2">
                <SkeletonLine width="w-20" height="h-3" />
                <SkeletonLine width="w-24" height="h-5" />
              </div>
            </div>
          </div>
        </SkeletonCard>

        {/* Members Skeleton */}
        <div className="space-y-3">
          <SkeletonLine width="w-24" height="h-5" />
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>

        {/* Event Feed Skeleton */}
        <div className="space-y-3">
          <SkeletonLine width="w-32" height="h-5" />
          <SkeletonCard>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonEventRow key={i} />
              ))}
            </div>
          </SkeletonCard>
        </div>
      </div>
    </div>
  );
}
