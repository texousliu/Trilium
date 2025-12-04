import { useTriliumOptionInt } from "../react/hooks";
import clsx from "clsx";
import server from "../../services/server";
import { VNode } from "preact";
import { useEffect, useState } from "preact/hooks";
import { Dayjs } from "@triliumnext/commons";
import { t } from "../../services/i18n";

interface DateNotesForMonth {
    [date: string]: string;
}

const DAYS_OF_WEEK = [
    t("calendar.sun"),
    t("calendar.mon"),
    t("calendar.tue"),
    t("calendar.wed"),
    t("calendar.thu"),
    t("calendar.fri"),
    t("calendar.sat")
];

interface DateRangeInfo {
    weekNumbers: number[];
    dates: Dayjs[];
}

export default function Calendar({ date }: { date: Dayjs }) {
    const [ rawFirstDayOfWeek ] = useTriliumOptionInt("firstDayOfWeek") ?? 0;
    const firstDayOfWeekISO = (rawFirstDayOfWeek === 0 ? 7 : rawFirstDayOfWeek);

    const month = date.format('YYYY-MM');
    const firstDay = date.startOf('month');
    const firstDayISO = firstDay.isoWeekday();
    const monthInfo = getMonthInformation(date, firstDayISO, firstDayOfWeekISO);

    return (
        <>
            <CalendarWeekHeader rawFirstDayOfWeek={rawFirstDayOfWeek} />
            <div className="calendar-body" data-calendar-area="month">
                {firstDayISO !== firstDayOfWeekISO && <PreviousMonthDays date={date} info={monthInfo.prevMonth} />}
                <CurrentMonthDays date={date} firstDayOfWeekISO={firstDayOfWeekISO} />
                <NextMonthDays date={date} dates={monthInfo.nextMonth.dates} />
            </div>
        </>
    )
}

function CalendarWeekHeader({ rawFirstDayOfWeek }: { rawFirstDayOfWeek: number }) {
    let localeDaysOfWeek = [...DAYS_OF_WEEK];
    const shifted = localeDaysOfWeek.splice(0, rawFirstDayOfWeek);
    localeDaysOfWeek = ['', ...localeDaysOfWeek, ...shifted];

    return (
        <div className="calendar-week">
            {localeDaysOfWeek.map(dayOfWeek => <span>{dayOfWeek}</span>)}
        </div>
    )
}

function PreviousMonthDays({ date, info: { dates, weekNumbers } }: { date: Dayjs, info: DateRangeInfo }) {
    const prevMonth = date.subtract(1, 'month').format('YYYY-MM');
    const [ dateNotesForPrevMonth, setDateNotesForPrevMonth ] = useState<DateNotesForMonth>();

    useEffect(() => {
        server.get<DateNotesForMonth>(`special-notes/notes-for-month/${prevMonth}`).then(setDateNotesForPrevMonth);
    }, [ date ]);

    return (
        <>
            <CalendarWeek weekNumber={weekNumbers[0]} />
            {dates.map(date => <CalendarDay date={date} dateNotesForMonth={dateNotesForPrevMonth} className="calendar-date-prev-month" />)}
        </>
    )
}

function CurrentMonthDays({ date, firstDayOfWeekISO }: { date: Dayjs, firstDayOfWeekISO: number }) {
    let dateCursor = date;
    const currentMonth = date.month();
    const items: VNode[] = [];
    while (dateCursor.month() === currentMonth) {
        const weekNumber = getWeekNumber(dateCursor, firstDayOfWeekISO);
        if (dateCursor.isoWeekday() === firstDayOfWeekISO) {
            items.push(<CalendarWeek weekNumber={weekNumber} />)
        }

        items.push(<CalendarDay date={dateCursor} dateNotesForMonth={{}} />)
        dateCursor = dateCursor.add(1, "day");
    }

    return items;
}

function NextMonthDays({ date, dates }: { date: Dayjs, dates: Dayjs[] }) {
    const nextMonth = date.add(1, 'month').format('YYYY-MM');
    const [ dateNotesForNextMonth, setDateNotesForNextMonth ] = useState<DateNotesForMonth>();

    useEffect(() => {
        server.get<DateNotesForMonth>(`special-notes/notes-for-month/${nextMonth}`).then(setDateNotesForNextMonth);
    }, [ date ]);

    return dates.map(date => (
        <CalendarDay date={date} dateNotesForMonth={dateNotesForNextMonth} className="calendar-date-next-month" />
    ));
}

function CalendarDay({ date, dateNotesForMonth, className }: { date: Dayjs, dateNotesForMonth?: DateNotesForMonth, className?: string }) {
    return (
        <a
            className={clsx("calendar-date", className)}
            data-calendar-date={date.local().format("YYYY-MM-DD")}
        >
            <span>
                {date.date()}
            </span>
        </a>
    );
}

function CalendarWeek({ weekNumber }: { weekNumber: number }) {
    return (
        <span className="calendar-week-number calendar-week-number-disabled">{weekNumber}</span>
    )
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
