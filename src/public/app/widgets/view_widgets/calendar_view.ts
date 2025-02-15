import type FNote from "../../entities/fnote.js";
import ViewMode, { type ViewModeArgs } from "./view_mode.js";

const TPL = `
<div class="calendar-view">
    <style>
    .calendar-view {
        overflow: hidden;
        position: relative;
        height: 100%;
    }
    </style>

    Hello world.
</div>
`;

export default class CalendarView extends ViewMode {

    private $root: JQuery<HTMLElement>;

    constructor(args: ViewModeArgs) {
        super(args);

        this.$root = $(TPL);
        args.$parent.append(this.$root);
    }

    async renderList(): Promise<JQuery<HTMLElement> | undefined> {
        return this.$root;
    }

}
