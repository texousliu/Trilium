import { PluginDef } from "@fullcalendar/core/index.js";
import { ViewModeProps } from "../interface";
import Calendar from "./calendar";
import { useEffect, useState } from "preact/hooks";
import "./index.css";
import { useTriliumOption, useTriliumOptionInt } from "../../react/hooks";

interface CalendarViewData {

}

const CALENDAR_VIEWS = [
    "timeGridWeek",
    "dayGridMonth",
    "multiMonthYear",
    "listMonth"
]

export default function CalendarView({ note, noteIds }: ViewModeProps<CalendarViewData>) {
    const plugins = usePlugins(false, false);
    const [ firstDayOfWeek ] = useTriliumOptionInt("firstDayOfWeek");

    return (plugins &&
        <div className="calendar-view">
            <Calendar
                plugins={plugins}
                tabIndex={100}
                initialView="dayGridMonth"
                headerToolbar={{
                    start: "title",
                    end: `${CALENDAR_VIEWS.join(",")} today prev,next`
                }}
                firstDay={firstDayOfWeek ?? 0}
            />
        </div>
    );
}

function usePlugins(isEditable: boolean, isCalendarRoot: boolean) {
    const [ plugins, setPlugins ] = useState<PluginDef[]>();

    useEffect(() => {
        async function loadPlugins() {
            const plugins: PluginDef[] = [];
            plugins.push((await import("@fullcalendar/daygrid")).default);
            plugins.push((await import("@fullcalendar/timegrid")).default);
            plugins.push((await import("@fullcalendar/list")).default);
            plugins.push((await import("@fullcalendar/multimonth")).default);
            if (isEditable || isCalendarRoot) {
                plugins.push((await import("@fullcalendar/interaction")).default);
            }
            setPlugins(plugins);
        }

        loadPlugins();
    }, [ isEditable, isCalendarRoot ]);

    return plugins;
}
