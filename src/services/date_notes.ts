import noteService from "./notes.js";
import attributeService from "./attributes.js";
import dateUtils from "./date_utils.js";
import sql from "./sql.js";
import protectedSessionService from "./protected_session.js";
import searchService from "../services/search/services/search.js";
import SearchContext from "../services/search/search_context.js";
import hoistedNoteService from "./hoisted_note.js";
import type BNote from "../becca/entities/bnote.js";
import optionService from "./options.js";
import { t } from "i18next";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter.js";

dayjs.extend(isSameOrAfter);

const CALENDAR_ROOT_LABEL = "calendarRoot";
const YEAR_LABEL = "yearNote";
const MONTH_LABEL = "monthNote";
const WEEK_LABEL = "weekNote";
const DATE_LABEL = "dateNote";

const WEEKDAY_TRANSLATION_IDS = ["weekdays.sunday", "weekdays.monday", "weekdays.tuesday", "weekdays.wednesday", "weekdays.thursday", "weekdays.friday", "weekdays.saturday", "weekdays.sunday"];

const MONTH_TRANSLATION_IDS = [
    "months.january",
    "months.february",
    "months.march",
    "months.april",
    "months.may",
    "months.june",
    "months.july",
    "months.august",
    "months.september",
    "months.october",
    "months.november",
    "months.december"
];

function createNote(parentNote: BNote, noteTitle: string) {
    return noteService.createNewNote({
        parentNoteId: parentNote.noteId,
        title: noteTitle,
        content: "",
        isProtected: parentNote.isProtected && protectedSessionService.isProtectedSessionAvailable(),
        type: "text"
    }).note;
}

function getRootCalendarNote(): BNote {
    let rootNote;

    const workspaceNote = hoistedNoteService.getWorkspaceNote();

    if (!workspaceNote || !workspaceNote.isRoot()) {
        rootNote = searchService.findFirstNoteWithQuery("#workspaceCalendarRoot", new SearchContext({ ignoreHoistedNote: false }));
    }

    if (!rootNote) {
        rootNote = attributeService.getNoteWithLabel(CALENDAR_ROOT_LABEL);
    }

    if (!rootNote) {
        sql.transactional(() => {
            rootNote = noteService.createNewNote({
                parentNoteId: "root",
                title: "Calendar",
                target: "into",
                isProtected: false,
                type: "text",
                content: ""
            }).note;

            attributeService.createLabel(rootNote.noteId, CALENDAR_ROOT_LABEL);
            attributeService.createLabel(rootNote.noteId, "sorted");
        });
    }

    return rootNote as BNote;
}

function getYearNote(dateStr: string, _rootNote: BNote | null = null): BNote {
    const rootNote = _rootNote || getRootCalendarNote();

    const yearStr = dateStr.trim().substring(0, 4);

    let yearNote = searchService.findFirstNoteWithQuery(`#${YEAR_LABEL}="${yearStr}"`, new SearchContext({ ancestorNoteId: rootNote.noteId }));

    if (yearNote) {
        return yearNote;
    }

    sql.transactional(() => {
        yearNote = createNote(rootNote, yearStr);

        attributeService.createLabel(yearNote.noteId, YEAR_LABEL, yearStr);
        attributeService.createLabel(yearNote.noteId, "sorted");

        const yearTemplateAttr = rootNote.getOwnedAttribute("relation", "yearTemplate");

        if (yearTemplateAttr) {
            attributeService.createRelation(yearNote.noteId, "template", yearTemplateAttr.value);
        }
    });

    return yearNote as unknown as BNote;
}

function getMonthNoteTitle(rootNote: BNote, monthNumber: string, dateObj: Date) {
    const pattern = rootNote.getOwnedLabelValue("monthPattern") || "{monthNumberPadded} - {month}";
    const monthName = t(MONTH_TRANSLATION_IDS[dateObj.getMonth()]);

    return pattern
        .replace(/{shortMonth3}/g, monthName.slice(0, 3))
        .replace(/{shortMonth4}/g, monthName.slice(0, 4))
        .replace(/{isoMonth}/g, dateUtils.utcDateStr(dateObj).slice(0, 7))
        .replace(/{monthNumberPadded}/g, monthNumber)
        .replace(/{month}/g, monthName);
}

function getMonthNote(dateStr: string, _rootNote: BNote | null = null): BNote {
    const rootNote = _rootNote || getRootCalendarNote();

    const monthStr = dateStr.substring(0, 7);
    const monthNumber = dateStr.substring(5, 7);

    let monthNote = searchService.findFirstNoteWithQuery(`#${MONTH_LABEL}="${monthStr}"`, new SearchContext({ ancestorNoteId: rootNote.noteId }));

    if (monthNote) {
        return monthNote;
    }

    const dateObj = dateUtils.parseLocalDate(dateStr);

    const noteTitle = getMonthNoteTitle(rootNote, monthNumber, dateObj);

    const yearNote = getYearNote(dateStr, rootNote);

    sql.transactional(() => {
        monthNote = createNote(yearNote, noteTitle);

        attributeService.createLabel(monthNote.noteId, MONTH_LABEL, monthStr);
        attributeService.createLabel(monthNote.noteId, "sorted");

        const monthTemplateAttr = rootNote.getOwnedAttribute("relation", "monthTemplate");

        if (monthTemplateAttr) {
            attributeService.createRelation(monthNote.noteId, "template", monthTemplateAttr.value);
        }
    });

    return monthNote as unknown as BNote;
}

function getDayNoteTitle(rootNote: BNote, dayNumber: string, dateObj: Date) {
    const pattern = rootNote.getOwnedLabelValue("datePattern") || "{dayInMonthPadded} - {weekDay}";
    const weekDay = t(WEEKDAY_TRANSLATION_IDS[dateObj.getDay()]);

    return pattern
        .replace(/{ordinal}/g, ordinal(parseInt(dayNumber)))
        .replace(/{dayInMonthPadded}/g, dayNumber)
        .replace(/{isoDate}/g, dateUtils.utcDateStr(dateObj))
        .replace(/{weekDay}/g, weekDay)
        .replace(/{weekDay3}/g, weekDay.substring(0, 3))
        .replace(/{weekDay2}/g, weekDay.substring(0, 2));
}

/** produces 1st, 2nd, 3rd, 4th, 21st, 31st for 1, 2, 3, 4, 21, 31 */
function ordinal(dayNumber: number) {
    const suffixes = ["th", "st", "nd", "rd"];
    const suffix = suffixes[(dayNumber - 20) % 10] || suffixes[dayNumber] || suffixes[0];

    return `${dayNumber}${suffix}`;
}

function getDayNote(dateStr: string, _rootNote: BNote | null = null): BNote {
    const rootNote = _rootNote || getRootCalendarNote();

    dateStr = dateStr.trim().substring(0, 10);

    let dateNote = searchService.findFirstNoteWithQuery(`#${DATE_LABEL}="${dateStr}"`, new SearchContext({ ancestorNoteId: rootNote.noteId }));

    if (dateNote) {
        return dateNote;
    }

    let dateParentNote;

    if (checkWeekNoteEnabled(rootNote)) {
        dateParentNote = getWeekNote(getWeekNumberStr(dayjs(dateStr)), rootNote);
    } else {
        dateParentNote = getMonthNote(dateStr, rootNote);
    }

    const dayNumber = dateStr.substring(8, 10);

    const dateObj = dateUtils.parseLocalDate(dateStr);

    const noteTitle = getDayNoteTitle(rootNote, dayNumber, dateObj);

    sql.transactional(() => {
        dateNote = createNote(dateParentNote as BNote, noteTitle);

        attributeService.createLabel(dateNote.noteId, DATE_LABEL, dateStr.substring(0, 10));

        const dateTemplateAttr = rootNote.getOwnedAttribute("relation", "dateTemplate");

        if (dateTemplateAttr) {
            attributeService.createRelation(dateNote.noteId, "template", dateTemplateAttr.value);
        }
    });

    return dateNote as unknown as BNote;
}

function getTodayNote(rootNote: BNote | null = null) {
    return getDayNote(dateUtils.localNowDate(), rootNote);
}

function getWeekStartDate(date: Date, startOfWeek: string): Date {
    const day = date.getDay();
    let diff;

    if (startOfWeek === "monday") {
        diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    } else if (startOfWeek === "sunday") {
        diff = date.getDate() - day;
    } else {
        throw new Error(`Unrecognized start of the week ${startOfWeek}`);
    }

    const startDate = new Date(date);
    startDate.setDate(diff);
    return startDate;
}

// TODO: Duplicated with getWeekNumber in src/public/app/widgets/buttons/calendar.ts
// Maybe can be merged later in monorepo setup
function getWeekNumberStr(date: Dayjs): string {
    const year = date.year();
    const dayOfWeek = (day: number) => (day - parseInt(optionService.getOption("firstDayOfWeek")) + 7) % 7;

    // Get first day of the year and adjust to first week start
    const jan1 = date.clone().year(year).month(0).date(1);
    const jan1Weekday = jan1.day();
    const dayOffset = dayOfWeek(jan1Weekday);
    let firstWeekStart = jan1.clone().subtract(dayOffset, 'day');

    // Adjust based on week rule
    switch (parseInt(optionService.getOption("firstWeekOfYear"))) {
        case 1: { // ISO 8601: first week contains Thursday
            const thursday = firstWeekStart.clone().add(3, 'day'); // Monday + 3 = Thursday
            if (thursday.year() < year) {
                firstWeekStart = firstWeekStart.add(7, 'day');
            }
            break;
        }
        case 2: { // minDaysInFirstWeek rule
            const daysInFirstWeek = 7 - dayOffset;
            if (daysInFirstWeek < parseInt(optionService.getOption("minDaysInFirstWeek"))) {
                firstWeekStart = firstWeekStart.add(7, 'day');
            }
            break;
        }
        // default case 0: week containing Jan 1 → already handled
    }

    const diffDays = date.startOf('day').diff(firstWeekStart.startOf('day'), 'day');
    const weekNumber = Math.floor(diffDays / 7) + 1;

    // Handle case when date is before first week start → belongs to last week of previous year
    if (weekNumber <= 0) {
        return getWeekNumberStr(date.subtract(1, 'day'));
    }

    // Handle case when date belongs to first week of next year
    const nextYear = year + 1;
    const jan1Next = date.clone().year(nextYear).month(0).date(1);
    const jan1WeekdayNext = jan1Next.day();
    const offsetNext = dayOfWeek(jan1WeekdayNext);
    let nextYearWeekStart = jan1Next.clone().subtract(offsetNext, 'day');

    switch (parseInt(optionService.getOption("firstWeekOfYear"))) {
        case 1: {
            const thursday = nextYearWeekStart.clone().add(3, 'day');
            if (thursday.year() < nextYear) {
                nextYearWeekStart = nextYearWeekStart.add(7, 'day');
            }
            break;
        }
        case 2: {
            const daysInFirstWeek = 7 - offsetNext;
            if (daysInFirstWeek < parseInt(optionService.getOption("minDaysInFirstWeek"))) {
                nextYearWeekStart = nextYearWeekStart.add(7, 'day');
            }
            break;
        }
    }

    if (date.isSameOrAfter(nextYearWeekStart)) {
        return `${nextYear}-W01`;
    }

    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}

function getWeekFirstDayNote(dateStr: string, rootNote: BNote | null = null) {
    const startOfWeek = optionService.getOption("firstDayOfWeek") === '0' ? 'sunday' : 'monday';

    const dateObj = getWeekStartDate(dateUtils.parseLocalDate(dateStr), startOfWeek);

    dateStr = dateUtils.utcDateTimeStr(dateObj);

    return getDayNote(dateStr, rootNote);
}

function checkWeekNoteEnabled(rootNote: BNote) {
    if (!rootNote.hasLabel('enableWeekNote')) {
        return false;
    }
    return true;
}

function getWeekNoteTitle(rootNote: BNote, weekNumber: number) {
    const pattern = rootNote.getOwnedLabelValue("weekPattern") || "Week {weekNumber}";

    return pattern
        .replace(/{weekNumber}/g, weekNumber.toString());
}

function getWeekNote(weekStr: string, _rootNote: BNote | null = null): BNote | null {
    const rootNote = _rootNote || getRootCalendarNote();
    if (!checkWeekNoteEnabled(rootNote)) {
        return null;
    }

    weekStr = weekStr.trim().substring(0, 8);

    let weekNote = searchService.findFirstNoteWithQuery(`#${WEEK_LABEL}="${weekStr}"`, new SearchContext({ ancestorNoteId: rootNote.noteId }));

    if (weekNote) {
        return weekNote;
    }

    const [yearStr, weekNumStr] = weekStr.trim().split('-W');

    const year = parseInt(yearStr);
    const weekNumber = parseInt(weekNumStr);

    const firstDayOfYear = new Date(year, 0, 1);
    const weekStartDate = new Date(firstDayOfYear);
    weekStartDate.setDate(firstDayOfYear.getDate() + (weekNumber - 1) * 7);

    const startDate = getWeekStartDate(weekStartDate, optionService.getOption("firstDayOfWeek") === '0' ? 'sunday' : 'monday');
    const monthNote = getMonthNote(dateUtils.utcDateStr(startDate), rootNote);

    const noteTitle = getWeekNoteTitle(rootNote, weekNumber);

    sql.transactional(() => {
        weekNote = createNote(monthNote, noteTitle);

        attributeService.createLabel(weekNote.noteId, WEEK_LABEL, weekStr);
        attributeService.createLabel(weekNote.noteId, "sorted");

        const weekTemplateAttr = rootNote.getOwnedAttribute("relation", "weekTemplate");

        if (weekTemplateAttr) {
            attributeService.createRelation(weekNote.noteId, "template", weekTemplateAttr.value);
        }
    });

    return weekNote as unknown as BNote;
}

export default {
    getRootCalendarNote,
    getYearNote,
    getMonthNote,
    getWeekNote,
    getWeekFirstDayNote,
    getDayNote,
    getTodayNote
};
