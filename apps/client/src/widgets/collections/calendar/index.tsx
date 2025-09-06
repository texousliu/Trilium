import { DateSelectArg, EventChangeArg, EventSourceFuncArg, LocaleInput, PluginDef } from "@fullcalendar/core/index.js";
import { ViewModeProps } from "../interface";
import Calendar from "./calendar";
import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
import "./index.css";
import { useNoteLabel, useNoteLabelBoolean, useResizeObserver, useSpacedUpdate, useTriliumOption, useTriliumOptionInt } from "../../react/hooks";
import { CreateChildrenResponse, LOCALE_IDS } from "@triliumnext/commons";
import { Calendar as FullCalendar } from "@fullcalendar/core";
import { removeOwnedAttributesByNameOrType, setLabel } from "../../../services/attributes";
import { circle } from "leaflet";
import server from "../../../services/server";
import { parseStartEndDateFromEvent, parseStartEndTimeFromEvent } from "./utils";
import dialog from "../../../services/dialog";
import { t } from "../../../services/i18n";
import { buildEvents, buildEventsForCalendar } from "./event_builder";
import { changeEvent, newEvent } from "./api";
import froca from "../../../services/froca";
import date_notes from "../../../services/date_notes";
import appContext from "../../../components/app_context";
import { DateClickArg } from "@fullcalendar/interaction";

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
    const containerRef = useRef<HTMLDivElement>(null);
    const calendarRef = useRef<FullCalendar>(null);

    const [ calendarRoot ] = useNoteLabelBoolean(note, "calendarRoot");
    const [ workspaceCalendarRoot ] = useNoteLabelBoolean(note, "workspaceCalendarRoot");
    const [ firstDayOfWeek ] = useTriliumOptionInt("firstDayOfWeek");
    const [ hideWeekends ] = useNoteLabelBoolean(note, "calendar:hideWeekends");
    const [ weekNumbers ] = useNoteLabelBoolean(note, "calendar:weekNumbers");
    const [ calendarView, setCalendarView ] = useNoteLabel(note, "calendar:view");
    const initialView = useRef(calendarView);
    const viewSpacedUpdate = useSpacedUpdate(() => setCalendarView(initialView.current));
    useResizeObserver(containerRef, () => calendarRef.current?.updateSize());
    const isCalendarRoot = (calendarRoot || workspaceCalendarRoot);
    const isEditable = !isCalendarRoot;
    const eventBuilder = useMemo(() => {
        if (!isCalendarRoot) {
            return async () => await buildEvents(noteIds);
        } else {
            return async (e: EventSourceFuncArg) => await buildEventsForCalendar(note, e);
        }
    }, [isCalendarRoot, noteIds]);

    const plugins = usePlugins(isEditable, isCalendarRoot);
    const locale = useLocale();

    const onCalendarSelection = useCallback(async (e: DateSelectArg) => {
        const { startDate, endDate } = parseStartEndDateFromEvent(e);
        if (!startDate) return;
        const { startTime, endTime } = parseStartEndTimeFromEvent(e);

        // Ask for the title
        const title = await dialog.prompt({ message: t("relation_map.enter_title_of_new_note"), defaultValue: t("relation_map.default_new_note_title") });
        if (!title?.trim()) {
            return;
        }

        newEvent(note, { title, startDate, endDate, startTime, endTime });
    }, [ note ]);

    const onEventChange = useCallback(async (e: EventChangeArg) => {
        const { startDate, endDate } = parseStartEndDateFromEvent(e.event);
        if (!startDate) return;

        const { startTime, endTime } = parseStartEndTimeFromEvent(e.event);
        const note = await froca.getNote(e.event.extendedProps.noteId);
        if (!note) return;
        changeEvent(note, { startDate, endDate, startTime, endTime });
    }, []);

    // Called upon when clicking the day number in the calendar, opens or creates the day note but only if in a calendar root.
    const onDateClick = useCallback(async (e: DateClickArg) => {
        const eventNote = await date_notes.getDayNote(e.dateStr);
        if (eventNote) {
            appContext.triggerCommand("openInPopup", { noteIdOrPath: eventNote.noteId });
        }
    }, []);

    return (plugins &&
        <div className="calendar-view" ref={containerRef}>
            <Calendar
                events={eventBuilder}
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
                height="100%"
                nowIndicator
                handleWindowResize={false}
                locale={locale}
                editable={isEditable} selectable={isEditable}
                select={onCalendarSelection}
                eventChange={onEventChange}
                dateClick={isCalendarRoot ? onDateClick : undefined}
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
