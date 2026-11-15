import { describe, expect, it } from "vitest";
import { GROUP_ALIAS, MEMBER_ALIAS, restoreNames } from "@/lib/recap/pseudonym";

describe("restoreNames", () => {
  it("setzt Gruppen- und Mitgliedsnamen wieder ein", () => {
    const text = `${MEMBER_ALIAS}, du hältst ${GROUP_ALIAS} wach.`;
    expect(restoreNames(text, { group: "Büro 3", member: "Anna" })).toBe(
      "Anna, du hältst Büro 3 wach.",
    );
  });

  it("verträgt leicht abgewandelte Platzhalter", () => {
    expect(restoreNames("[ name ] trinkt am meisten in [Gruppe].", { group: "WG", member: "Tom" })).toBe(
      "Tom trinkt am meisten in WG.",
    );
  });

  it("lässt Text ohne Platzhalter unverändert", () => {
    expect(restoreNames("Ein ruhiger Monat.", { group: "WG" })).toBe("Ein ruhiger Monat.");
  });
});
