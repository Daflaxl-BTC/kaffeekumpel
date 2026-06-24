export default function Loading() {
  return (
    <main className="min-h-screen px-6 py-12 max-w-md mx-auto animate-pulse">
      <div className="h-8 w-32 rounded-lg bg-kaffee-100" />
      <div className="mt-2 h-8 w-48 rounded-lg bg-kaffee-100" />
      <div className="mt-4 h-4 w-full rounded bg-kaffee-100/70" />
      <div className="mt-2 h-4 w-3/4 rounded bg-kaffee-100/70" />

      <div className="mt-6 space-y-5 rounded-2xl border border-kaffee-100 bg-white/80 p-6">
        <div className="h-12 w-full rounded-xl bg-kaffee-100/80" />
        <div className="border-t border-kaffee-100" />
        <div className="h-12 w-full rounded-xl bg-kaffee-100/80" />
        <div className="h-11 w-full rounded-xl bg-kaffee-100" />
      </div>
    </main>
  );
}
