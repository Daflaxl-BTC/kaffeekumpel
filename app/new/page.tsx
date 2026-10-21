"use client";

import { createGroup } from "./actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function NewGroupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [groupName, setGroupName] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!groupName.trim()) {
      toast.error("Bitte geben Sie einen Gruppennamen ein.");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("group_name", groupName);

      const result = await createGroup(formData);

      if (!result.success) {
        toast.error(result.error || "Ein Fehler ist aufgetreten.");
        setIsLoading(false);
        return;
      }

      toast.success("Gruppe erstellt! Weiterleitend...");
      // Redirect to group page after short delay to show success message
      setTimeout(() => {
        router.push(`/g/${result.slug}`);
      }, 1000);
    } catch (error) {
      console.error("[NewGroupPage] Form submission error:", error);
      toast.error("Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white p-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-amber-900 mb-2">Neue Gruppe</h1>
          <p className="text-gray-600 mb-6">
            Erstellen Sie eine neue Kaffeekumpel-Gruppe für Ihre WG, Ihr Büro oder
            Ihren Coworking-Space.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="group_name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Gruppenname
              </label>
              <input
                id="group_name"
                name="group_name"
                type="text"
                placeholder="z.B. WG Hauptstraße, Büro Xyz"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !groupName.trim()}
              className="w-full py-2 px-4 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              {isLoading ? "Wird erstellt..." : "Gruppe erstellen"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Nach der Erstellung erhalten Sie einen QR-Code, den Sie neben Ihrer
          Kaffeemaschine aufhängen können.
        </p>
      </div>
    </div>
  );
}
