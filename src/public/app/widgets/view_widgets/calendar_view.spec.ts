import { describe, it } from "vitest";
import { buildNotes } from "../../test/easy-froca.js";

describe("Building events", () => {
    it("supports start date", async () => {
        const noteIds = buildNotes([
            { title: "A", "#startDate": "2025-05-05" },
            { title: "A", "#startDate": "2025-05-07" },
        ]);

        const CalendarView = (await import("./calendar_view.js")).default;
        const events = await CalendarView.buildEvents(noteIds);
        console.log(noteIds, events);
    });

});
