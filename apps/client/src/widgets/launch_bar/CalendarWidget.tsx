import { Dispatch, StateUpdater, useEffect, useMemo, useState } from "preact/hooks";
import FNote from "../../entities/fnote";
import { LaunchBarDropdownButton, useLauncherIconAndTitle } from "./launch_bar_widgets";
import { Dayjs, dayjs } from "@triliumnext/commons";
import appContext from "../../components/app_context";
import "./CalendarWidget.css";
import Calendar, { CalendarArgs } from "./Calendar";
import ActionButton from "../react/ActionButton";
import { t } from "../../services/i18n";
import FormDropdownList from "../react/FormDropdownList";
import FormTextBox from "../react/FormTextBox";
import toast from "../../services/toast";
import date_notes from "../../services/date_notes";

const MONTHS = [
    t("calendar.january"),
    t("calendar.february"),
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

export default function CalendarWidget({ launcherNote }: { launcherNote: FNote }) {
    const { title, icon } = useLauncherIconAndTitle(launcherNote);
    const [ calendarArgs, setCalendarArgs ] = useState<Pick<CalendarArgs, "activeDate" | "todaysDate">>();
    const [ date, setDate ] = useState<Dayjs>();

    return (
        <LaunchBarDropdownButton
            icon={icon} title={title}
            onShown={() => {
                const dateNote = appContext.tabManager.getActiveContextNote()?.getOwnedLabelValue("dateNote");
                const activeDate = dateNote ? dayjs(`${dateNote}T12:00:00`) : null
                const todaysDate = dayjs();
                setCalendarArgs({
                    activeDate,
                    todaysDate,
                });
                setDate(dayjs(activeDate || todaysDate).startOf('month'));
            }}
            dropdownOptions={{
                autoClose: "outside"
            }}
        >
            {calendarArgs && date && <div className="calendar-dropdown-widget" style={{ width: 400 }}>
                <CalendarHeader date={date} setDate={setDate} />
                <Calendar
                    date={date}
                    onDateClicked={async (date, e) => {
                        const note = await date_notes.getDayNote(date);
                        if (note) {
                            appContext.tabManager.getActiveContext()?.setNote(note.noteId);
                            // this.dropdown?.hide();
                        } else {
                            toast.showError(t("calendar.cannot_find_day_note"));
                        }
                        e.stopPropagation();
                    }}
                    {...calendarArgs}
                />
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
            <CalendarYearSelector {...props} />
        </div>
    )
}

function CalendarMonthSelector({ date, setDate }: CalendarHeaderProps) {
    const months = useMemo(() => (
        Array.from(MONTHS.entries().map(([ index, text ]) => ({
            index: index.toString(), text
        })))
    ), []);

    return (
        <div className="calendar-month-selector">
            <AdjustDateButton date={date} setDate={setDate} direction="prev" unit="month" />
            <FormDropdownList
                values={months} currentValue={date.month().toString()}
                keyProperty="index" titleProperty="text"
                onChange={value => {

                }}
                buttonProps={{ "data-calendar-input": "month" }}
            />
            <AdjustDateButton date={date} setDate={setDate} direction="next" unit="month" />
        </div>
    );
}

function CalendarYearSelector({ date, setDate }: CalendarHeaderProps) {
    return (
        <div className="calendar-year-selector">
            <AdjustDateButton date={date} setDate={setDate} direction="prev" unit="year" />
            <FormTextBox
                type="number"
                min="1900" max="2999" step="1"
                currentValue={date.year().toString()}
                onChange={(newValue) => {
                    const year = parseInt(newValue, 10);
                    if (!Number.isNaN(year)) {
                        setDate(date.set("year", year));
                    }
                }}
                data-calendar-input="year"
            />
            <AdjustDateButton date={date} setDate={setDate} direction="next" unit="year" />
        </div>
    )
}

function AdjustDateButton({ date, setDate, unit, direction }: CalendarHeaderProps & {
    direction: "prev" | "next",
    unit: "month" | "year"
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
