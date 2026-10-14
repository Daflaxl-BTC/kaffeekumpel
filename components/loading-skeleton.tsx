import { cn } from '@/lib/utils';

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white p-4 animate-pulse',
        className
      )}
    >
      <div className="space-y-3">
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-4 w-1/2 rounded bg-gray-200" />
        <div className="pt-2 space-y-2">
          <div className="h-3 w-full rounded bg-gray-150" />
          <div className="h-3 w-4/5 rounded bg-gray-150" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonLine({ width = 'w-full', height = 'h-4' }: { width?: string; height?: string }) {
  return (
    <div className={cn(width, height, 'rounded bg-gray-200 animate-pulse')} />
  );
}

export function SkeletonCircle({ size = 'w-10 h-10' }: { size?: string }) {
  return (
    <div
      className={cn(size, 'rounded-full bg-gray-200 animate-pulse')}
    />
  );
}

export function SkeletonEventRow() {
  return (
    <div className="border-b border-gray-200 pb-3 mb-3 last:border-b-0 animate-pulse">
      <div className="flex gap-3">
        <SkeletonCircle size="w-8 h-8" />
        <div className="flex-1 space-y-2">
          <SkeletonLine width="w-3/4" height="h-3" />
          <SkeletonLine width="w-1/2" height="h-2" />
        </div>
      </div>
    </div>
  );
}
