export default function Loading() {
  return (
    <main className="min-h-screen max-w-2xl mx-auto px-4 pt-6 pb-24 animate-pulse">
      <header className="mb-6">
        <div className="h-7 w-40 rounded-lg bg-kaffee-100" />
        <div className="mt-2 h-4 w-56 rounded bg-kaffee-100/70" />
      </header>

      <div className="h-16 w-full rounded-2xl bg-kaffee-100/80" />

      <section className="mt-6 space-y-3">
        <div className="h-4 w-28 rounded bg-kaffee-100/70" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-20 rounded-2xl bg-kaffee-100/80" />
          <div className="h-20 rounded-2xl bg-kaffee-100/80" />
          <div className="h-20 rounded-2xl bg-kaffee-100/80" />
        </div>
      </section>

      <section className="mt-6 space-y-3">
        <div className="h-4 w-28 rounded bg-kaffee-100/70" />
        <div className="h-24 w-full rounded-2xl bg-kaffee-100/80" />
      </section>

      <section className="mt-6 space-y-3">
        <div className="h-4 w-28 rounded bg-kaffee-100/70" />
        <div className="h-32 w-full rounded-2xl bg-kaffee-100/80" />
      </section>
    </main>
  );
}
