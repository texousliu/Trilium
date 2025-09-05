import { DateSelectArg, EventSourceFuncArg, LocaleInput, PluginDef } from "@fullcalendar/core/index.js";
import { ViewModeProps } from "../interface";
import Calendar from "./calendar";
import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
import "./index.css";
import { useNoteLabel, useNoteLabelBoolean, useResizeObserver, useSpacedUpdate, useTriliumOption, useTriliumOptionInt } from "../../react/hooks";
import { CreateChildrenResponse, LOCALE_IDS } from "@triliumnext/commons";
import { Calendar as FullCalendar } from "@fullcalendar/core";
import { setLabel } from "../../../services/attributes";
import { circle } from "leaflet";
import server from "../../../services/server";
import { parseStartEndDateFromEvent, parseStartEndTimeFromEvent } from "./utils";
import dialog from "../../../services/dialog";
import { t } from "../../../services/i18n";
import { buildEvents, buildEventsForCalendar } from "./event_builder";

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
        // Handle start and end date
        const { startDate, endDate } = parseStartEndDateFromEvent(e);
        if (!startDate) {
            return;
        }

        // Handle start and end time.
        const { startTime, endTime } = parseStartEndTimeFromEvent(e);

        // Ask for the title
        const title = await dialog.prompt({ message: t("relation_map.enter_title_of_new_note"), defaultValue: t("relation_map.default_new_note_title") });
        if (!title?.trim()) {
            return;
        }

        // Create the note.
        const { note: eventNote } = await server.post<CreateChildrenResponse>(`notes/${note.noteId}/children?target=into`, {
            title,
            content: "",
            type: "text"
        });

        // Set the attributes.
        setLabel(eventNote.noteId, "startDate", startDate);
        if (endDate) {
            setLabel(eventNote.noteId, "endDate", endDate);
        }
        if (startTime) {
            setLabel(eventNote.noteId, "startTime", startTime);
        }
        if (endTime) {
            setLabel(eventNote.noteId, "endTime", endTime);
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
                handleWindowResize={false}
                locale={locale}
                editable={isEditable} selectable={isEditable}
                select={onCalendarSelection}
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
