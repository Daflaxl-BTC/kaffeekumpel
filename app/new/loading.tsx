export default function NewGroupLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white p-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="h-8 w-48 bg-gray-200 rounded mb-2 animate-pulse"></div>
          <div className="h-4 w-full bg-gray-100 rounded mb-6 animate-pulse"></div>

          <div className="space-y-4">
            <div>
              <div className="h-4 w-32 bg-gray-200 rounded mb-2 animate-pulse"></div>
              <div className="h-10 w-full bg-gray-100 rounded animate-pulse"></div>
            </div>

            <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
