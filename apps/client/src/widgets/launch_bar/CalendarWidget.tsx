import { useEffect, useState } from "preact/hooks";
import FNote from "../../entities/fnote";
import { LaunchBarDropdownButton, useLauncherIconAndTitle } from "./launch_bar_widgets";
import { Dayjs, dayjs } from "@triliumnext/commons";
import appContext from "../../components/app_context";
import { useTriliumOptionInt } from "../react/hooks";
import clsx from "clsx";
import "./CalendarWidget.css";
import server from "../../services/server";
import { DateRangeInfo, getMonthInformation, getWeekNumber } from "./CalendarWidgetUtils";
import { VNode } from "preact";

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
    const monthInfo = getMonthInformation(date, firstDayISO, firstDayOfWeekISO);

    return (
        <div className="calendar-body" data-calendar-area="month">
            {firstDayISO !== firstDayOfWeekISO && <PreviousMonthDays date={date} info={monthInfo.prevMonth} />}
            <CurrentMonthDays date={date} firstDayOfWeekISO={firstDayOfWeekISO} />
            <NextMonthDays date={date} dates={monthInfo.nextMonth.dates} />
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
