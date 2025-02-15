import type { EventSourceInput } from "@fullcalendar/core";
import froca from "../../services/froca.js";
import ViewMode, { type ViewModeArgs } from "./view_mode.js";

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

            if (!startDate) {
                continue;
            }

            events.push({
                title: note.title,
                start: startDate
            });
        }

        return events;
    }

}
