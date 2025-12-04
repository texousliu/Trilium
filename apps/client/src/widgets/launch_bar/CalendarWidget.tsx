import { Dispatch, StateUpdater, useEffect, useState } from "preact/hooks";
import FNote from "../../entities/fnote";
import { LaunchBarDropdownButton, useLauncherIconAndTitle } from "./launch_bar_widgets";
import { Dayjs, dayjs } from "@triliumnext/commons";
import appContext from "../../components/app_context";
import "./CalendarWidget.css";
import Calendar from "./Calendar";
import ActionButton from "../react/ActionButton";

export default function CalendarWidget({ launcherNote }: { launcherNote: FNote }) {
    const { title, icon } = useLauncherIconAndTitle(launcherNote);
    const [ date, setDate ] = useState<Dayjs>();

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
                <CalendarHeader date={date} setDate={setDate} />
                <Calendar date={date} />
            </div>}
        </LaunchBarDropdownButton>
    )
}

interface CalendarHeaderProps {
    date: Dayjs;
    setDate: Dispatch<StateUpdater<Dayjs | undefined>>;
}

function CalendarHeader(props: CalendarHeaderProps) {
    return (
        <div className="calendar-header">
            <CalendarMonthSelector {...props} />
        </div>
    )
}

function CalendarMonthSelector({ date, setDate }: CalendarHeaderProps) {
    return (
        <div className="calendar-month-selector">
            <AdjustDateButton date={date} setDate={setDate} direction="prev" unit="month" />
            <AdjustDateButton date={date} setDate={setDate} direction="next" unit="month" />
        </div>
    );
}

function AdjustDateButton({ date, setDate, unit, direction }: CalendarHeaderProps & {
    direction: "prev" | "next",
    unit: "month"
}) {
    return (
        <ActionButton
            icon={direction === "prev" ? "bx bx-chevron-left" : "bx bx-chevron-right" }
            className="calendar-btn tn-tool-button"
            noIconActionClass
            text=""
            onClick={(e) => {
                e.stopPropagation();
                const newDate = direction === "prev" ? date.subtract(1, unit) : date.add(1, unit);
                setDate(newDate);
            }}
        />
    )
}
