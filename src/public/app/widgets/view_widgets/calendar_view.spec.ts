import { describe, expect, it } from "vitest";
import { buildNotes } from "../../test/easy-froca.js";
import CalendarView from "./calendar_view.js";

describe("Building events", () => {
    it("supports start date", async () => {
        const noteIds = buildNotes([
            { title: "Note 1", "#startDate": "2025-05-05" },
            { title: "Note 2", "#startDate": "2025-05-07" },
        ]);
        const events = await CalendarView.buildEvents(noteIds);

        expect(events).toHaveLength(2);
        expect(events[0]).toMatchObject({
            title: "Note 1",
            start: "2025-05-05",
            end: "2025-05-06"
        });
        expect(events[1]).toMatchObject({
            title: "Note 2",
            start: "2025-05-07",
            end: "2025-05-08"
        });
    });

    it("ignores notes with only end date", async () => {
        const noteIds = buildNotes([
            { title: "Note 1", "#endDate": "2025-05-05" },
            { title: "Note 2", "#endDateDate": "2025-05-07" },
        ]);
        const events = await CalendarView.buildEvents(noteIds);

        expect(events).toHaveLength(0);
    });

    it("supports both start date and end date", async () => {
        const noteIds = buildNotes([
            { title: "Note 1", "#startDate": "2025-05-05", "#endDate": "2025-05-05" },
            { title: "Note 2", "#startDate": "2025-05-07", "#endDate": "2025-05-08" },
        ]);
        const events = await CalendarView.buildEvents(noteIds);

        expect(events).toHaveLength(2);
        expect(events[0]).toMatchObject({
            title: "Note 1",
            start: "2025-05-05",
            end: "2025-05-06"
        });
        expect(events[1]).toMatchObject({
            title: "Note 2",
            start: "2025-05-07",
            end: "2025-05-09"
        });
    });
});
