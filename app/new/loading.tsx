import { Card } from '@/components/ui/card';

export default function NewGroupLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="p-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-gray-100 rounded animate-pulse mb-6" />

          <div className="space-y-4">
            <div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
            </div>
            <div>
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
            </div>
            <div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-10 w-full bg-gray-300 rounded animate-pulse" />
          </div>
        </div>
      </Card>
    </div>
  );
}
