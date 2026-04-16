import { describe, it, expect } from "vitest";
import { computeCleaningStatus } from "../lib/cleaning";

const iso = (d: Date) => d.toISOString();

describe("computeCleaningStatus", () => {
  const now = new Date("2026-04-16T12:00:00Z");
  const baseMembers = [
    { id: "a", name: "Anna", created_at: iso(new Date("2026-01-01")), active: true },
    { id: "b", name: "Bernd", created_at: iso(new Date("2026-02-01")), active: true },
    { id: "c", name: "Clara", created_at: iso(new Date("2026-03-01")), active: true },
  ];

  it("nie geputzt → erster beigetretener ist dran, urgency=overdue", () => {
    const s = computeCleaningStatus(baseMembers, [], 7, now);
    expect(s.next_up?.id).toBe("a");
    expect(s.urgency).toBe("overdue");
    expect(s.last_cleaned_at).toBe(null);
  });

  it("wer zuletzt geputzt hat, ist am wenigsten dran", () => {
    const events = [
      { member_id: "a", created_at: iso(new Date("2026-04-10")) }, // vor 6 Tagen
      { member_id: "b", created_at: iso(new Date("2026-04-14")) }, // vor 2 Tagen
    ];
    const s = computeCleaningStatus(baseMembers, events, 7, now);
    // Clara hat nie geputzt → sie ist dran
    expect(s.next_up?.id).toBe("c");
    expect(s.last_cleaned_by?.id).toBe("b");
    expect(s.days_since_last).toBe(2);
    expect(s.urgency).toBe("ok");
  });

  it("urgency=overdue wenn > interval Tage seit letzter Reinigung", () => {
    const events = [
      { member_id: "a", created_at: iso(new Date("2026-04-01")) }, // vor 15 Tagen
    ];
    const s = computeCleaningStatus(baseMembers, events, 7, now);
    expect(s.urgency).toBe("overdue");
  });

  it("urgency=due_soon wenn fast am Limit", () => {
    const events = [
      { member_id: "a", created_at: iso(new Date("2026-04-10")) }, // vor 6 Tagen, interval=7
    ];
    const s = computeCleaningStatus(baseMembers, events, 7, now);
    expect(s.urgency).toBe("due_soon");
  });

  it("inaktive Mitglieder rotieren nicht", () => {
    const members = [
      { id: "a", name: "Anna", created_at: iso(new Date("2026-01-01")), active: false },
      { id: "b", name: "Bernd", created_at: iso(new Date("2026-02-01")), active: true },
    ];
    const s = computeCleaningStatus(members, [], 7, now);
    expect(s.next_up?.id).toBe("b");
  });
});
