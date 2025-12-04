import { useEffect, useState } from "preact/hooks";
import FNote from "../../entities/fnote";
import { LaunchBarDropdownButton, useLauncherIconAndTitle } from "./launch_bar_widgets";
import { Dayjs, dayjs } from "@triliumnext/commons";
import appContext from "../../components/app_context";
import { useTriliumOptionInt } from "../react/hooks";
import { VNode } from "preact";
import clsx from "clsx";
import "./CalendarWidget.css";
import server from "../../services/server";

interface DateNotesForMonth {
    [date: string]: string;
}

export default function CalendarWidget({ launcherNote }: { launcherNote: FNote }) {
    const { title, icon } = useLauncherIconAndTitle(launcherNote);
    const [ date, setDate ] = useState<Dayjs>();
    const [ rawFirstDayOfWeek ] = useTriliumOptionInt("firstDayOfWeek") ?? 0;
    const firstDayOfWeekISO = (rawFirstDayOfWeek === 0 ? 7 : rawFirstDayOfWeek);

    useEffect(() => {

    })

    return (
        <LaunchBarDropdownButton
            icon={icon} title={title}
            onShown={() => {
                const dateNote = appContext.tabManager.getActiveContextNote()?.getOwnedLabelValue("dateNote");
                const activeDate = dateNote ? dayjs(`${dateNote}T12:00:00`) : null;
                const todaysDate = dayjs();
                const date = dayjs(activeDate || todaysDate).startOf('month');
                setDate(date);
            }}
        >
            {date && <div className="calendar-dropdown-widget" style={{ width: 400 }}>
                <Calendar date={date} firstDayOfWeekISO={firstDayOfWeekISO} />
            </div>}
        </LaunchBarDropdownButton>
    )
}

function Calendar({ date, firstDayOfWeekISO }: { date: Dayjs, firstDayOfWeekISO: number }) {
    const month = date.format('YYYY-MM');
    const firstDay = date.startOf('month');
    const firstDayISO = firstDay.isoWeekday();

    return (
        <div className="calendar-body" data-calendar-area="month">
            {firstDayISO !== firstDayOfWeekISO && <PreviousMonthDays date={date} firstDayISO={firstDayISO} firstDayOfWeekISO={firstDayOfWeekISO} />}
            <CurrentMonthDays date={date} firstDayOfWeekISO={firstDayOfWeekISO} />
            <NextMonthDays date={date} firstDayOfWeekISO={firstDayOfWeekISO} />
        </div>
    )
}

function PreviousMonthDays({ date, firstDayISO, firstDayOfWeekISO }: { date: Dayjs, firstDayISO: number, firstDayOfWeekISO: number }) {
    const prevMonth = date.subtract(1, 'month').format('YYYY-MM');
    const { weekNumber, dates } = getPrevMonthDays(date, firstDayISO, firstDayOfWeekISO);
    const [ dateNotesForPrevMonth, setDateNotesForPrevMonth ] = useState<DateNotesForMonth>();

    useEffect(() => {
        server.get<DateNotesForMonth>(`special-notes/notes-for-month/${prevMonth}`).then(setDateNotesForPrevMonth);
    }, [ date ]);

    return dates.map(date => (
        <CalendarDay date={date} dateNotesForMonth={dateNotesForPrevMonth} className="calendar-date-prev-month" />
    ));
}

function CurrentMonthDays({ date, firstDayOfWeekISO }: { date: Dayjs, firstDayOfWeekISO: number }) {
    const dates = getCurMonthDays(date, firstDayOfWeekISO);

    return dates.map(date => (
        <CalendarDay date={date} dateNotesForMonth={{}} />
    ));
}

function NextMonthDays({ date, firstDayOfWeekISO }: { date: Dayjs, firstDayOfWeekISO: number }) {
    const lastDayOfMonth = date.endOf('month');
    const lastDayISO = lastDayOfMonth.isoWeekday();
    const lastDayOfUserWeek = ((firstDayOfWeekISO + 6 - 1) % 7) + 1;
    const nextMonth = date.add(1, 'month').format('YYYY-MM');
    const [ dateNotesForNextMonth, setDateNotesForNextMonth ] = useState<DateNotesForMonth>();

    useEffect(() => {
        server.get<DateNotesForMonth>(`special-notes/notes-for-month/${nextMonth}`).then(setDateNotesForNextMonth);
    }, [ date ]);

    const dates = lastDayISO !== lastDayOfUserWeek ? getNextMonthDays(date, lastDayISO, firstDayOfWeekISO) : [];
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

function getPrevMonthDays(date: Dayjs, firstDayISO: number, firstDayOfWeekISO: number): { weekNumber: number, dates: Dayjs[] } {
    const prevMonthLastDay = date.subtract(1, 'month').endOf('month');
    const daysToAdd = (firstDayISO - firstDayOfWeekISO + 7) % 7;
    const dates: Dayjs[] = [];

    const firstDay = date.startOf('month');
    const weekNumber = getWeekNumber(firstDay, firstDayOfWeekISO);

    // Get dates from previous month
    for (let i = daysToAdd - 1; i >= 0; i--) {
        dates.push(prevMonthLastDay.subtract(i, 'day'));
    }

    return { weekNumber, dates };
}

function getCurMonthDays(date: Dayjs, firstDayOfWeekISO: number) {
    let dateCursor = date;
    const currentMonth = date.month();
    const dates: Dayjs[] = [];
    while (dateCursor.month() === currentMonth) {
        dates.push(dateCursor);
        dateCursor = dateCursor.add(1, "day");
    }
    return dates;
}

function getNextMonthDays(date: Dayjs, lastDayISO: number, firstDayOfWeekISO): Dayjs[] {
    const nextMonthFirstDay = date.add(1, 'month').startOf('month');
    const dates: Dayjs[] = [];

    const lastDayOfUserWeek = ((firstDayOfWeekISO + 6 - 1) % 7) + 1; // ISO wrap
    const daysToAdd = (lastDayOfUserWeek - lastDayISO + 7) % 7;

    for (let i = 0; i < daysToAdd; i++) {
        dates.push(nextMonthFirstDay.add(i, 'day'));
    }
    return dates;
}

function getWeekNumber(date: Dayjs, firstDayOfWeekISO: number): number {
    const weekStart = getWeekStartDate(date, firstDayOfWeekISO);
    return weekStart.isoWeek();
}

function getWeekStartDate(date: Dayjs, firstDayOfWeekISO: number): Dayjs {
    const currentISO = date.isoWeekday();
    const diff = (currentISO - firstDayOfWeekISO + 7) % 7;
    return date.clone().subtract(diff, "day").startOf("day");
}
