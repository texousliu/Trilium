import { t } from "../../services/i18n.js";
import utils from "../../services/utils.js";
import dateNoteService from "../../services/date_notes.js";
import server from "../../services/server.js";
import appContext from "../../components/app_context.js";
import RightDropdownButtonWidget from "./right_dropdown_button.js";
import toastService from "../../services/toast.js";
import options from "../../services/options.js";
import { Dropdown } from "bootstrap";
import type { EventData } from "../../components/app_context.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import "../../../stylesheets/calendar.css";

dayjs.extend(utc);

const MONTHS = [
    t("calendar.january"),
    t("calendar.febuary"),
    t("calendar.march"),
    t("calendar.april"),
    t("calendar.may"),
    t("calendar.june"),
    t("calendar.july"),
    t("calendar.august"),
    t("calendar.september"),
    t("calendar.october"),
    t("calendar.november"),
    t("calendar.december")
];

const DROPDOWN_TPL = `
<div class="calendar-dropdown-widget">
    <style>
        .calendar-dropdown-widget {
            width: 400px;
        }
    </style>

    <div class="calendar-header">
        <div class="calendar-month-selector">
            <button class="calendar-btn tn-tool-button bx bx-chevron-left" data-calendar-toggle="previous"></button>

            <button class="btn dropdown-toggle select-button" type="button"
                data-bs-toggle="dropdown" data-bs-auto-close="true"
                aria-expanded="false"
                data-calendar-input="month"></button>
            <ul class="dropdown-menu" data-calendar-input="month-list">
                ${Object.entries(MONTHS)
        .map(([i, month]) => `<li><button class="dropdown-item" data-value=${i}>${month}</button></li>`)
        .join("")}
            </ul>

            <button class="calendar-btn tn-tool-button bx bx-chevron-right" data-calendar-toggle="next"></button>
        </div>

        <div class="calendar-year-selector">
            <button class="calendar-btn tn-tool-button bx bx-chevron-left" data-calendar-toggle="previousYear"></button>

            <input type="number" min="1900" max="2999" step="1" data-calendar-input="year" />

            <button class="calendar-btn tn-tool-button bx bx-chevron-right" data-calendar-toggle="nextYear"></button>
        </div>
    </div>

    <div class="calendar-week"></div>
    <div class="calendar-body" data-calendar-area="month"></div>
</div>`;

const DAYS_OF_WEEK = [t("calendar.sun"), t("calendar.mon"), t("calendar.tue"), t("calendar.wed"), t("calendar.thu"), t("calendar.fri"), t("calendar.sat")];

interface DateNotesForMonth {
    [date: string]: string;
}

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
    private firstDayOfWeek!: number;
    private weekCalculationOptions!: WeekCalculationOptions;
    private activeDate: Date | null = null;
    private todaysDate!: Date;
    private date!: Date;

    constructor(title: string = "", icon: string = "") {
        super(title, icon, DROPDOWN_TPL);
    }

    doRender() {
        super.doRender();

        this.$month = this.$dropdownContent.find('[data-calendar-area="month"]');
        this.$weekHeader = this.$dropdownContent.find(".calendar-week");

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
                this.date = dayjs(this.date).month(parseInt(value)).toDate();
                this.createMonth();
            }
        });
        this.$next = this.$dropdownContent.find('[data-calendar-toggle="next"]');
        this.$next.on("click", () => {
            this.date = dayjs(this.date).add(1, 'month').toDate();
            this.createMonth();
        });
        this.$previous = this.$dropdownContent.find('[data-calendar-toggle="previous"]');
        this.$previous.on("click", () => {
            this.date = dayjs(this.date).subtract(1, 'month').toDate();
            this.createMonth();
        });

        // Year navigation
        this.$yearSelect = this.$dropdownContent.find('[data-calendar-input="year"]');
        this.$yearSelect.on("input", (e) => {
            const target = e.target as HTMLInputElement;
            this.date = dayjs(this.date).year(parseInt(target.value)).toDate();
            this.createMonth();
        });
        this.$nextYear = this.$dropdownContent.find('[data-calendar-toggle="nextYear"]');
        this.$nextYear.on("click", () => {
            this.date = dayjs(this.date).add(1, 'year').toDate();
            this.createMonth();
        });
        this.$previousYear = this.$dropdownContent.find('[data-calendar-toggle="previousYear"]');
        this.$previousYear.on("click", () => {
            this.date = dayjs(this.date).subtract(1, 'year').toDate();
            this.createMonth();
        });

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

        // Handle click events for the entire calendar widget
        this.$dropdownContent.on("click", (e) => {
            const $target = $(e.target);

            // Keep dropdown open when clicking on month select button or year selector area
            if ($target.closest('.btn.dropdown-toggle.select-button').length ||
                $target.closest('.calendar-year-selector').length) {
                e.stopPropagation();
                return;
            }

            // Hide dropdown for all other cases
            this.monthDropdown.hide();
            // Prevent dismissing the calendar popup by clicking on an empty space inside it.
            e.stopPropagation();
        });
    }

    manageFirstDayOfWeek() {
        this.firstDayOfWeek = options.getInt("firstDayOfWeek") || 0;

        // Generate the list of days of the week taking into consideration the user's selected first day of week.
        let localeDaysOfWeek = [...DAYS_OF_WEEK];
        const daysToBeAddedAtEnd = localeDaysOfWeek.splice(0, this.firstDayOfWeek);
        localeDaysOfWeek = ['', ...localeDaysOfWeek, ...daysToBeAddedAtEnd];
        this.$weekHeader.html(localeDaysOfWeek.map((el) => `<span>${el}</span>`).join(''));
    }

    initWeekCalculation() {
        this.weekCalculationOptions = {
            firstWeekType: options.getInt("firstWeekOfYear") || 0,
            minDaysInFirstWeek: options.getInt("minDaysInFirstWeek") || 4
        };
    }

    getWeekNumber(date: Date): number {
        const year = dayjs(date).year();
        const jan1 = dayjs().year(year).month(0).date(1);
        const jan1Day = jan1.day();

        let firstWeekStart = jan1.clone();

        let dayOffset;
        if (jan1Day < this.firstDayOfWeek) {
            dayOffset = jan1Day + (7 - this.firstDayOfWeek);
        } else {
            dayOffset = jan1Day - this.firstDayOfWeek;
        }
        firstWeekStart = firstWeekStart.subtract(dayOffset, 'day');

        switch (this.weekCalculationOptions.firstWeekType) {
            // case 0 is default: week containing Jan 1
            case 1: {
                let thursday = firstWeekStart.clone();
                const day = thursday.day();
                const offset = (4 - day + 7) % 7;
                thursday = thursday.add(offset, 'day');
                if (thursday.year() < year) {
                    firstWeekStart = firstWeekStart.add(7, 'day');
                }
                break;
            }
            case 2: {
                const daysInFirstWeek = 7 - dayOffset;
                if (daysInFirstWeek < this.weekCalculationOptions.minDaysInFirstWeek) {
                    firstWeekStart = firstWeekStart.add(7, 'day');
                }
                break;
            }
        }

        const diffDays = dayjs(date).diff(firstWeekStart, 'day') + 1;
        const weekNumber = Math.floor(diffDays / 7) + 1;

        // Check if the week number is less than 0, which means the date is in the previous year
        if (weekNumber <= 0) {
            const prevYearLastWeek = this.getWeekNumber(dayjs(date).subtract(1, 'year').endOf('year').toDate());
            return prevYearLastWeek;
        }

        // Check if it's the last week of December
        if (dayjs(date).month() === 11) { // December
            const lastDayOfYear = dayjs().year(year).month(11).date(31);
            const lastWeekStart = lastDayOfYear.subtract((lastDayOfYear.day() - this.firstDayOfWeek + 7) % 7, 'day');

            if (this.isEqual(date, lastWeekStart.toDate())) {
                const nextYearFirstWeek = this.getWeekNumber(lastDayOfYear.add(1, 'day').toDate());
                return nextYearFirstWeek;
            }
        }

        return weekNumber;
    }

    async dropdownShown() {
        this.init(appContext.tabManager.getActiveContextNote()?.getOwnedLabelValue("dateNote") ?? null);
    }

    init(activeDate: string | null) {
        // attaching time fixes local timezone handling
        this.activeDate = activeDate ? dayjs(`${activeDate}T12:00:00`).toDate() : null;
        this.todaysDate = dayjs().toDate();
        this.date = dayjs(this.activeDate || this.todaysDate).startOf('month').toDate();

        this.createMonth();
    }

    createDay(dateNotesForMonth: DateNotesForMonth, num: number) {
        const $newDay = $("<a>").addClass("calendar-date").attr("data-calendar-date", utils.formatDateISO(this.date));
        const $date = $("<span>").html(String(num));

        const dateNoteId = dateNotesForMonth[utils.formatDateISO(this.date)];

        if (dateNoteId) {
            $newDay.addClass("calendar-date-exists");
            $newDay.attr("data-href", `#root/${dateNoteId}`);
        }

        if (this.isEqual(this.date, this.activeDate)) {
            $newDay.addClass("calendar-date-active");
        }

        if (this.isEqual(this.date, this.todaysDate)) {
            $newDay.addClass("calendar-date-today");
        }

        $newDay.append($date);
        return $newDay;
    }

    createWeekNumber(weekNumber: number) {
        const weekNumberText = String(weekNumber);
        const $newWeekNumber = $("<a>").addClass("calendar-date calendar-week-number").attr("data-calendar-week-number", 'W' + weekNumberText.padStart(2, '0'));
        const $weekNumber = $("<span>").html(weekNumberText);

        $newWeekNumber.append($weekNumber);
        return $newWeekNumber;
    }

    isEqual(a: Date, b: Date | null) {
        if ((!a && b) || (a && !b)) {
            return false;
        }

        if (!b) return false;

        return dayjs(a).isSame(dayjs(b), 'day');
    }

    private getPrevMonthDays(firstDayOfWeek: number): { weekNumber: number, dates: Date[] } {
        const prevMonthLastDay = dayjs(this.date).subtract(1, 'month').endOf('month');
        const daysToAdd = (firstDayOfWeek - this.firstDayOfWeek + 7) % 7;
        const dates = [];

        const firstDay = dayjs(this.date).startOf('month');
        const weekNumber = this.getWeekNumber(firstDay.toDate());

        // Get dates from previous month
        for (let i = daysToAdd - 1; i >= 0; i--) {
            dates.push(prevMonthLastDay.subtract(i, 'day').toDate());
        }

        return { weekNumber, dates };
    }

    private getNextMonthDays(lastDayOfWeek: number): Date[] {
        const nextMonthFirstDay = dayjs(this.date).add(1, 'month').startOf('month');
        const dates = [];

        const lastDayOfUserWeek = (this.firstDayOfWeek + 6) % 7;
        const daysToAdd = (lastDayOfUserWeek - lastDayOfWeek + 7) % 7;

        // Get dates from next month
        for (let i = 0; i < daysToAdd; i++) {
            dates.push(nextMonthFirstDay.add(i, 'day').toDate());
        }

        return dates;
    }

    async createMonth() {
        const month = dayjs(this.date).format('YYYY-MM');
        const dateNotesForMonth: DateNotesForMonth = await server.get(`special-notes/notes-for-month/${month}`);

        this.$month.empty();

        const firstDay = dayjs(this.date).startOf('month');
        const firstDayOfWeek = firstDay.day();

        // Add dates from previous month
        if (firstDayOfWeek !== this.firstDayOfWeek) {
            const { weekNumber, dates } = this.getPrevMonthDays(firstDayOfWeek);

            const prevMonth = dayjs(this.date).subtract(1, 'month').format('YYYY-MM');
            const dateNotesForPrevMonth: DateNotesForMonth = await server.get(`special-notes/notes-for-month/${prevMonth}`);

            const $weekNumber = this.createWeekNumber(weekNumber);
            this.$month.append($weekNumber);

            dates.forEach(date => {
                const tempDate = this.date;
                this.date = date;
                const $day = this.createDay(dateNotesForPrevMonth, dayjs(date).date());
                $day.addClass('calendar-date-prev-month');
                this.$month.append($day);
                this.date = tempDate;
            });
        }

        const currentMonth = this.date.getMonth();

        while (this.date.getMonth() === currentMonth) {
            // Using UTC to avoid issues with summer/winter time
            const weekNumber = this.getWeekNumber(dayjs(this.date).utc().toDate());

            // Add week number if it's first day of week
            if (this.date.getDay() === this.firstDayOfWeek) {
                const $weekNumber = this.createWeekNumber(weekNumber);
                this.$month.append($weekNumber);
            }

            const $day = this.createDay(dateNotesForMonth, this.date.getDate());
            this.$month.append($day);

            this.date = dayjs(this.date).add(1, 'day').toDate();
        }
        // while loop trips over and day is at 30/31, bring it back
        this.date = dayjs(this.date).startOf('month').subtract(1, 'month').toDate();

        // Add dates from next month
        const lastDayOfMonth = dayjs(this.date).endOf('month').toDate();
        const lastDayOfWeek = lastDayOfMonth.getDay();
        const lastDayOfUserWeek = (this.firstDayOfWeek + 6) % 7;
        if (lastDayOfWeek !== lastDayOfUserWeek) {
            const dates = this.getNextMonthDays(lastDayOfWeek);

            const nextMonth = dayjs(this.date).add(1, 'month').format('YYYY-MM');
            const dateNotesForNextMonth: DateNotesForMonth = await server.get(`special-notes/notes-for-month/${nextMonth}`);

            dates.forEach(date => {
                const tempDate = this.date;
                this.date = date;
                const $day = this.createDay(dateNotesForNextMonth, dayjs(date).date());
                $day.addClass('calendar-date-next-month');
                this.$month.append($day);
                this.date = tempDate;
            });
        }

        this.$monthSelect.text(MONTHS[this.date.getMonth()]);
        this.$yearSelect.val(this.date.getFullYear());
    }

    async entitiesReloadedEvent({ loadResults }: EventData<"entitiesReloaded">) {
        if (!loadResults.getOptionNames().includes("firstDayOfWeek") &&
            !loadResults.getOptionNames().includes("firstWeekOfYear") &&
            !loadResults.getOptionNames().includes("minDaysInFirstWeek")) {
            return;
        }

        this.manageFirstDayOfWeek();
        this.initWeekCalculation();
        this.createMonth();
    }
}
