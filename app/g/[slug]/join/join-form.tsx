"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { joinGroup } from "../actions";

interface Props {
  slug: string;
  members: { id: string; name: string }[];
}

export function JoinForm({ slug, members }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"existing" | "new">(
    members.length > 0 ? "existing" : "new",
  );
  const [selectedId, setSelectedId] = useState<string>(members[0]?.id ?? "");
  const [newName, setNewName] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.set("slug", slug);
    fd.set("mode", mode);
    if (mode === "existing") fd.set("existingMemberId", selectedId);
    if (mode === "new") fd.set("newName", newName.trim());
    startTransition(async () => {
      try {
        await joinGroup(fd);
        toast.success("Willkommen!");
        router.replace(`/g/${slug}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Fehler");
      }
    });
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-5 bg-white/80 rounded-2xl p-6 border border-kaffee-100"
    >
      {members.length > 0 && (
        <>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="mode"
              value="existing"
              checked={mode === "existing"}
              onChange={() => setMode("existing")}
              className="mt-1.5"
            />
            <div className="flex-1">
              <div className="font-medium text-kaffee-900">
                Ich bin einer von denen
              </div>
              <div className="text-sm text-kaffee-700 mb-2">
                Wähl dich aus der Liste.
              </div>
              <select
                disabled={mode !== "existing"}
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full rounded-xl border border-kaffee-100 bg-white px-3 py-2 disabled:opacity-50"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <div className="border-t border-kaffee-100" />
        </>
      )}

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="radio"
          name="mode"
          value="new"
          checked={mode === "new"}
          onChange={() => setMode("new")}
          className="mt-1.5"
        />
        <div className="flex-1">
          <div className="font-medium text-kaffee-900">
            Ich bin neu in der Gruppe
          </div>
          <div className="text-sm text-kaffee-700 mb-2">
            Dein Name, wie er in der Übersicht auftauchen soll.
          </div>
          <input
            type="text"
            disabled={mode !== "new"}
            maxLength={50}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Max"
            className="w-full rounded-xl border border-kaffee-100 bg-white px-3 py-2 disabled:opacity-50"
          />
        </div>
      </label>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={
          pending ||
          (mode === "existing" && !selectedId) ||
          (mode === "new" && newName.trim().length === 0)
        }
      >
        {pending ? "Einen Moment …" : "Beitreten →"}
      </Button>
    </form>
  );
}
