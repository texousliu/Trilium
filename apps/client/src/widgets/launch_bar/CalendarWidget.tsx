import { useEffect, useState } from "preact/hooks";
import FNote from "../../entities/fnote";
import { LaunchBarDropdownButton, useLauncherIconAndTitle } from "./launch_bar_widgets";
import { Dayjs, dayjs } from "@triliumnext/commons";
import appContext from "../../components/app_context";
import "./CalendarWidget.css";
import Calendar from "./Calendar";

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
                <Calendar date={date} />
            </div>}
        </LaunchBarDropdownButton>
    )
}


