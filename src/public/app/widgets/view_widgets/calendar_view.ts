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

    constructor(args: ViewModeArgs) {
        super(args);

        this.$root = $(TPL);
        this.$calendarContainer = this.$root.find(".calendar-container");
        args.$parent.append(this.$root);
    }

    async renderList(): Promise<JQuery<HTMLElement> | undefined> {
        const { Calendar } = await import("@fullcalendar/core");
        const dayGridPlugin = (await import("@fullcalendar/daygrid")).default;

        const calendar = new Calendar(this.$calendarContainer[0], {
            plugins: [ dayGridPlugin ],
            initialView: "dayGridMonth"
        });
        calendar.render();

        return this.$root;
    }

}
