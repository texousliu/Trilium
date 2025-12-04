import { t } from "../../services/i18n.js";
import dateNoteService from "../../services/date_notes.js";
import server from "../../services/server.js";
import appContext from "../../components/app_context.js";
import RightDropdownButtonWidget from "./right_dropdown_button.js";
import toastService from "../../services/toast.js";
import options from "../../services/options.js";
import { Dropdown } from "bootstrap";
import type { EventData } from "../../components/app_context.js";
import { dayjs, type Dayjs } from "@triliumnext/commons";
import type { AttributeRow, OptionDefinitions } from "@triliumnext/commons";



const DROPDOWN_TPL = `
<div class="calendar-dropdown-widget">
    <div class="calendar-header">
        <div class="calendar-month-selector">
            <button class="btn dropdown-toggle select-button" type="button"
                data-bs-toggle="dropdown" data-bs-auto-close="true"
                aria-expanded="false"
                data-calendar-input="month"></button>

            <button class="calendar-btn tn-tool-button bx bx-chevron-right" data-calendar-toggle="next"></button>
        </div>

        <div class="calendar-year-selector">
            <button class="calendar-btn tn-tool-button bx bx-chevron-left" data-calendar-toggle="previousYear"></button>

            <input type="number" min="1900" max="2999" step="1" data-calendar-input="year" />

            <button class="calendar-btn tn-tool-button bx bx-chevron-right" data-calendar-toggle="nextYear"></button>
        </div>
    </div>


</div>`;

interface WeekCalculationOptions {
    firstWeekType: number;
    minDaysInFirstWeek: number;
}

export default class CalendarWidget extends RightDropdownButtonWidget {
    private $month!: JQuery<HTMLElement>;
    private $weekHeader!: JQuery<HTMLElement>;
    private $monthSelect!: JQuery<HTMLElement>;
    private $yearSelect!: JQuery<HTMLElement>;
    private $next!: JQuery<HTMLElement>;
    private $previous!: JQuery<HTMLElement>;
    private $nextYear!: JQuery<HTMLElement>;
    private $previousYear!: JQuery<HTMLElement>;
    private monthDropdown!: Dropdown;
    // stored in ISO 1–7
    private firstDayOfWeekISO!: number;
    private weekCalculationOptions!: WeekCalculationOptions;
    private activeDate: Dayjs | null = null;
    private todaysDate!: Dayjs;
    private date!: Dayjs;
    private weekNoteEnable: boolean = false;
    private weekNotes: string[] = [];

    constructor(title: string = "", icon: string = "") {
        super(title, icon, DROPDOWN_TPL, "calendar-dropdown-menu");
    }

    doRender() {
        super.doRender();

        this.$month = this.$dropdownContent.find('[data-calendar-area="month"]');

        this.manageFirstDayOfWeek();
        this.initWeekCalculation();

        // Month navigation
        this.$monthSelect = this.$dropdownContent.find('[data-calendar-input="month"]');
        this.$monthSelect.on("show.bs.dropdown", (e) => {
            // Don't trigger dropdownShown() at widget level when the month selection dropdown is shown, since it would cause a redundant refresh.
            e.stopPropagation();
        });
        this.monthDropdown = Dropdown.getOrCreateInstance(this.$monthSelect[0]);
        this.$dropdownContent.find('[data-calendar-input="month-list"] button').on("click", (e) => {
            const target = e.target as HTMLElement;
            const value = target.dataset.value;
            if (value) {
                this.date = this.date.month(parseInt(value));
                this.createMonth();
            }
        });

        // Year navigation
        this.$yearSelect = this.$dropdownContent.find('[data-calendar-input="year"]');
        this.$yearSelect.on("input", (e) => {
            const target = e.target as HTMLInputElement;
            this.date = this.date.year(parseInt(target.value));
            this.createMonth();
        });

        this.$nextYear = this.$dropdownContent.find('[data-calendar-toggle="nextYear"]');
        this.$nextYear.on("click", () => {
            this.date = this.date.add(1, 'year');
            this.createMonth();
        });

        this.$previousYear = this.$dropdownContent.find('[data-calendar-toggle="previousYear"]');
        this.$previousYear.on("click", () => {
            this.date = this.date.subtract(1, 'year');
            this.createMonth();
        });

        // Date click
        this.$dropdownContent.on("click", ".calendar-date", async (ev) => {
            const date = $(ev.target).closest(".calendar-date").attr("data-calendar-date");
            if (date) {
                const note = await dateNoteService.getDayNote(date);
                if (note) {
                    appContext.tabManager.getActiveContext()?.setNote(note.noteId);
                    this.dropdown?.hide();
                } else {
                    toastService.showError(t("calendar.cannot_find_day_note"));
                }
            }
            ev.stopPropagation();
        });

        // Week click
        this.$dropdownContent.on("click", ".calendar-week-number", async (ev) => {
            if (!this.weekNoteEnable) {
                return;
            }

            const week = $(ev.target).closest(".calendar-week-number").attr("data-calendar-week-number");

            if (week) {
                const note = await dateNoteService.getWeekNote(week);

                if (note) {
                    appContext.tabManager.getActiveContext()?.setNote(note.noteId);
                    this.dropdown?.hide();
                } else {
                    toastService.showError(t("calendar.cannot_find_week_note"));
                }
            }

            ev.stopPropagation();
        });

        // Handle click events for the entire calendar widget
        this.$dropdownContent.on("click", (e) => {
            const $target = $(e.target);

            // Keep dropdown open when clicking on month select button or year selector area
            if ($target.closest('.btn.dropdown-toggle.select-button').length) {
                e.stopPropagation();
                return;
            }

            // Hide dropdown for all other cases
            this.monthDropdown.hide();
            // Prevent dismissing the calendar popup by clicking on an empty space inside it.
            e.stopPropagation();
        });
    }

    private async getWeekNoteEnable() {
        const noteId = await server.get<string[]>(`search/${encodeURIComponent('#calendarRoot')}`);
        if (noteId.length === 0) {
            this.weekNoteEnable = false;
            return;
        }
        const noteAttributes = await server.get<AttributeRow[]>(`notes/${noteId}/attributes`);
        this.weekNoteEnable = noteAttributes.some(a => a.name === 'enableWeekNote');
    }

    initWeekCalculation() {
        this.weekCalculationOptions = {
            firstWeekType: options.getInt("firstWeekOfYear") || 0,
            minDaysInFirstWeek: options.getInt("minDaysInFirstWeek") || 4
        };
    }

    async dropdownShown() {
        await this.getWeekNoteEnable();
        this.weekNotes = await server.get<string[]>(`attribute-values/weekNote`);
        this.init( ?? null);
    }

    createDay() {
        const $date = $("<span>").html(String(num));
        const dateNoteId = dateNotesForMonth[this.date.local().format('YYYY-MM-DD')];

        if (dateNoteId) {
            $newDay.addClass("calendar-date-exists").attr("data-href", `#root/${dateNoteId}`);
        }

        if (this.date.isSame(this.activeDate, 'day')) $newDay.addClass("calendar-date-active");
        if (this.date.isSame(this.todaysDate, 'day')) $newDay.addClass("calendar-date-today");

        $newDay.append($date);
        return $newDay;
    }

    createWeekNumber(weekNumber: number) {
        const weekNoteId = this.date.local().format('YYYY-') + 'W' + String(weekNumber).padStart(2, '0');
        let $newWeekNumber;

        if (this.weekNoteEnable) {
            $newWeekNumber = $("<a>").addClass("calendar-date");
            if (this.weekNotes.includes(weekNoteId)) {
                $newWeekNumber.addClass("calendar-date-exists").attr("data-href", `#root/${weekNoteId}`);
            }
        } else {

        }

        $newWeekNumber.addClass("calendar-week-number").attr("data-calendar-week-number", weekNoteId);
        return $newWeekNumber;
    }

    async entitiesReloadedEvent({ loadResults }: EventData<"entitiesReloaded">) {
        const WEEK_OPTIONS: (keyof OptionDefinitions)[] = [
            "firstDayOfWeek",
            "firstWeekOfYear",
            "minDaysInFirstWeek",
        ];
        if (!WEEK_OPTIONS.some(opt => loadResults.getOptionNames().includes(opt))) {
            return;
        }

        this.manageFirstDayOfWeek();
        this.initWeekCalculation();
        this.createMonth();
    }
}
