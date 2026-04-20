import { createGroup } from "./actions";
import { Button } from "@/components/ui/button";

export default function NewGroupPage() {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-12 max-w-md mx-auto">
      <a
        href="/"
        className="text-sm text-kaffee-700 hover:underline inline-block mb-4"
      >
        ← zurück
      </a>
      <h1 className="text-2xl sm:text-3xl font-bold text-kaffee-900 mb-2">
        Neue Gruppe anlegen
      </h1>
      <p className="text-kaffee-700 mb-8">
        In 60 Sekunden fertig. Du kannst später alles ändern.
      </p>

      <form action={createGroup} className="space-y-5 bg-white/80 rounded-2xl p-4 sm:p-6 border border-kaffee-100">
        <div>
          <label
            htmlFor="groupName"
            className="block text-sm font-medium text-kaffee-900 mb-1"
          >
            Name der Gruppe
          </label>
          <input
            id="groupName"
            name="groupName"
            required
            maxLength={80}
            placeholder="z.B. WG Bahnhofstraße oder Büro 2. OG"
            className="w-full rounded-xl border border-kaffee-100 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-kaffee-500"
          />
        </div>

        <div>
          <label
            htmlFor="myName"
            className="block text-sm font-medium text-kaffee-900 mb-1"
          >
            Dein Name
          </label>
          <input
            id="myName"
            name="myName"
            required
            maxLength={50}
            placeholder="Felix"
            className="w-full rounded-xl border border-kaffee-100 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-kaffee-500"
          />
        </div>

        <div>
          <label
            htmlFor="coffeePrice"
            className="block text-sm font-medium text-kaffee-900 mb-1"
          >
            Preis pro Kaffee (in Euro)
          </label>
          <input
            id="coffeePrice"
            name="coffeePrice"
            type="number"
            step="0.10"
            min="0"
            defaultValue="0.30"
            className="w-full rounded-xl border border-kaffee-100 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-kaffee-500"
          />
          <p className="mt-1 text-xs text-kaffee-700/70">
            Änderbar später, beeinflusst die nächste Abrechnung.
          </p>
        </div>

        <Button type="submit" size="lg" className="w-full">
          Gruppe anlegen →
        </Button>
      </form>
    </main>
  );
}
