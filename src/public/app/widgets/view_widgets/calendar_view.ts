import type { EventSourceInput } from "@fullcalendar/core";
import froca from "../../services/froca.js";
import ViewMode, { type ViewModeArgs } from "./view_mode.js";
import type FNote from "../../entities/fnote.js";

const TPL = `
<div class="calendar-view">
    <style>
    .calendar-view {
        overflow: hidden;
        position: relative;
        height: 100%;
        user-select: none;
        padding: 10px;
    }

    .calendar-view a {
        color: unset;
    }
    </style>

    <div class="calendar-container">
    </div>
</div>
`;

export default class CalendarView extends ViewMode {

    private $root: JQuery<HTMLElement>;
    private $calendarContainer: JQuery<HTMLElement>;
    private noteIds: string[];

    constructor(args: ViewModeArgs) {
        super(args);

        this.$root = $(TPL);
        this.$calendarContainer = this.$root.find(".calendar-container");
        this.noteIds = args.noteIds;
        args.$parent.append(this.$root);
    }

    async renderList(): Promise<JQuery<HTMLElement> | undefined> {
        const { Calendar } = await import("@fullcalendar/core");
        const dayGridPlugin = (await import("@fullcalendar/daygrid")).default;

        const calendar = new Calendar(this.$calendarContainer[0], {
            plugins: [ dayGridPlugin ],
            initialView: "dayGridMonth",
            events: await CalendarView.#buildEvents(this.noteIds)
        });
        calendar.render();

        return this.$root;
    }

    static async #buildEvents(noteIds: string[]) {
        const notes = await froca.getNotes(noteIds);
        const events: EventSourceInput = [];

        for (const note of notes) {
            const startDate = note.getAttributeValue("label", "startDate");
            const customTitle = note.getAttributeValue("label", "calendar:title");

            if (!startDate) {
                continue;
            }

            const titles = await CalendarView.#parseCustomTitle(customTitle, note);
            for (const title of titles) {
                const eventData: typeof events[0] = {
                    title: title,
                    start: startDate
                };

                const endDate = new Date(note.getAttributeValue("label", "endDate") ?? startDate);
                if (endDate) {
                    // Fullcalendar end date is exclusive, not inclusive.
                    endDate.setDate(endDate.getDate() + 1);
                    eventData.end = endDate.toISOString().substring(0, 10);
                }

                events.push(eventData);
            }
        }

        return events;
    }

    static async #parseCustomTitle(customTitleValue: string | null, note: FNote, allowRelations = true): Promise<string[]> {
        if (customTitleValue) {
            const attributeName = customTitleValue.substring(1);
            if (customTitleValue.startsWith("#")) {
                const labelValue = note.getAttributeValue("label", attributeName);
                if (labelValue) {
                    return [ labelValue ];
                }
            } else if (allowRelations && customTitleValue.startsWith("~")) {
                const relations = note.getRelations(attributeName);
                if (relations.length > 0) {
                    const noteIds = relations.map((r) => r.targetNoteId);
                    const notesFromRelation = await froca.getNotes(noteIds);
                    const titles = [];

                    for (const targetNote of notesFromRelation) {
                        const targetCustomTitleValue = targetNote.getAttributeValue("label", "calendar:title");
                        const targetTitles = await CalendarView.#parseCustomTitle(targetCustomTitleValue, targetNote, false);
                        titles.push(targetTitles.flat());
                    }

                    return titles.flat();
                }
            }
        }

        return [ note.title ];
    }

}
