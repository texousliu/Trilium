import { LocaleInput, PluginDef } from "@fullcalendar/core/index.js";
import { ViewModeProps } from "../interface";
import Calendar from "./calendar";
import { useEffect, useRef, useState } from "preact/hooks";
import "./index.css";
import { useNoteLabel, useNoteLabelBoolean, useSpacedUpdate, useTriliumOption, useTriliumOptionInt } from "../../react/hooks";
import { LOCALE_IDS } from "@triliumnext/commons";
import { Calendar as FullCalendar } from "@fullcalendar/core";
import { setLabel } from "../../../services/attributes";
import { circle } from "leaflet";

interface CalendarViewData {

}

const CALENDAR_VIEWS = [
    "timeGridWeek",
    "dayGridMonth",
    "multiMonthYear",
    "listMonth"
]

// Here we hard-code the imports in order to ensure that they are embedded by webpack without having to load all the languages.
const LOCALE_MAPPINGS: Record<LOCALE_IDS, (() => Promise<{ default: LocaleInput }>) | null> = {
    de: () => import("@fullcalendar/core/locales/de"),
    es: () => import("@fullcalendar/core/locales/es"),
    fr: () => import("@fullcalendar/core/locales/fr"),
    cn: () => import("@fullcalendar/core/locales/zh-cn"),
    tw: () => import("@fullcalendar/core/locales/zh-tw"),
    ro: () => import("@fullcalendar/core/locales/ro"),
    ru: () => import("@fullcalendar/core/locales/ru"),
    ja: () => import("@fullcalendar/core/locales/ja"),
    "pt_br": () => import("@fullcalendar/core/locales/pt-br"),
    uk: () => import("@fullcalendar/core/locales/uk"),
    en: null
};

export default function CalendarView({ note, noteIds }: ViewModeProps<CalendarViewData>) {
    const calendarRef = useRef<FullCalendar>(null);
    const plugins = usePlugins(false, false);
    const locale = useLocale();
    const [ firstDayOfWeek ] = useTriliumOptionInt("firstDayOfWeek");
    const [ hideWeekends ] = useNoteLabelBoolean(note, "calendar:hideWeekends");
    const [ weekNumbers ] = useNoteLabelBoolean(note, "calendar:weekNumbers");
    const [ calendarView, setCalendarView ] = useNoteLabel(note, "calendar:view");
    const initialView = useRef(calendarView);
    const viewSpacedUpdate = useSpacedUpdate(() => setCalendarView(initialView.current));

    return (plugins &&
        <div className="calendar-view">
            <Calendar
                calendarRef={calendarRef}
                plugins={plugins}
                tabIndex={100}
                initialView={initialView.current && CALENDAR_VIEWS.includes(initialView.current) ? initialView.current : "dayGridMonth"}
                headerToolbar={{
                    start: "title",
                    end: `${CALENDAR_VIEWS.join(",")} today prev,next`
                }}
                firstDay={firstDayOfWeek ?? 0}
                weekends={!hideWeekends}
                weekNumbers={weekNumbers}
                locale={locale}
                viewDidMount={({ view }) => {
                    if (initialView.current !== view.type) {
                        initialView.current = view.type;
                        viewSpacedUpdate.scheduleUpdate();
                    }
                }}
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

function useLocale() {
    const [ locale ] = useTriliumOption("locale");
    const [ calendarLocale, setCalendarLocale ] = useState<LocaleInput>();

    useEffect(() => {
        const correspondingLocale = LOCALE_MAPPINGS[locale];
        if (correspondingLocale) {
            correspondingLocale().then((locale) => setCalendarLocale(locale.default));
        } else {
            setCalendarLocale(undefined);
        }
    });

    return calendarLocale;
}
