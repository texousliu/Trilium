import { Dayjs } from "@triliumnext/commons";
import { t } from "../../services/i18n";

export const DAYS_OF_WEEK = [
    t("calendar.sun"),
    t("calendar.mon"),
    t("calendar.tue"),
    t("calendar.wed"),
    t("calendar.thu"),
    t("calendar.fri"),
    t("calendar.sat")
];

export interface DateRangeInfo {
    weekNumbers: number[];
    dates: Dayjs[];
}

export function getMonthInformation(date: Dayjs, firstDayISO: number, firstDayOfWeekISO: number) {
    return {
        prevMonth: getPrevMonthDays(date, firstDayISO, firstDayOfWeekISO),
        nextMonth: getNextMonthDays(date, firstDayOfWeekISO)
    }
}

function getPrevMonthDays(date: Dayjs, firstDayISO: number, firstDayOfWeekISO: number): DateRangeInfo {
    const prevMonthLastDay = date.subtract(1, 'month').endOf('month');
    const daysToAdd = (firstDayISO - firstDayOfWeekISO + 7) % 7;
    const dates: Dayjs[] = [];

    const firstDay = date.startOf('month');
    const weekNumber = getWeekNumber(firstDay, firstDayOfWeekISO);

    // Get dates from previous month
    for (let i = daysToAdd - 1; i >= 0; i--) {
        dates.push(prevMonthLastDay.subtract(i, 'day'));
    }

    return { weekNumbers: [ weekNumber ], dates };
}

function getNextMonthDays(date: Dayjs, firstDayOfWeekISO: number): DateRangeInfo {
    const lastDayOfMonth = date.endOf('month');
    const lastDayISO = lastDayOfMonth.isoWeekday();
    const lastDayOfUserWeek = ((firstDayOfWeekISO + 6 - 1) % 7) + 1;
    const nextMonthFirstDay = date.add(1, 'month').startOf('month');
    const dates: Dayjs[] = [];

    if (lastDayISO !== lastDayOfUserWeek) {
        const daysToAdd = (lastDayOfUserWeek - lastDayISO + 7) % 7;

        for (let i = 0; i < daysToAdd; i++) {
            dates.push(nextMonthFirstDay.add(i, 'day'));
        }
    }
    return { weekNumbers: [], dates };
}

export function getWeekNumber(date: Dayjs, firstDayOfWeekISO: number): number {
    const weekStart = getWeekStartDate(date, firstDayOfWeekISO);
    return weekStart.isoWeek();
}

function getWeekStartDate(date: Dayjs, firstDayOfWeekISO: number): Dayjs {
    const currentISO = date.isoWeekday();
    const diff = (currentISO - firstDayOfWeekISO + 7) % 7;
    return date.clone().subtract(diff, "day").startOf("day");
}
