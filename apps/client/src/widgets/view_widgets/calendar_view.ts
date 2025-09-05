import type { Calendar, DateSelectArg, DatesSetArg, EventChangeArg, EventDropArg, EventInput, EventSourceFunc, EventSourceFuncArg, EventSourceInput, LocaleInput, PluginDef } from "@fullcalendar/core";
import froca from "../../services/froca.js";
import ViewMode, { type ViewModeArgs } from "./view_mode.js";
import type FNote from "../../entities/fnote.js";
import server from "../../services/server.js";
import { t } from "../../services/i18n.js";
import options from "../../services/options.js";
import dialogService from "../../services/dialog.js";
import attributes from "../../services/attributes.js";
import type { CommandListenerData, EventData } from "../../components/app_context.js";
import utils, { hasTouchBar } from "../../services/utils.js";
import date_notes from "../../services/date_notes.js";
import appContext from "../../components/app_context.js";
import type { EventImpl } from "@fullcalendar/core/internal";
import debounce, { type DebouncedFunction } from "debounce";
import type { TouchBarItem } from "../../components/touch_bar.js";
import type { SegmentedControlSegment } from "electron";
import { LOCALE_IDS } from "@triliumnext/commons";

// TODO: Deduplicate
interface CreateChildResponse {
    note: {
        noteId: string;
    };
}

interface Event {
    startDate: string,
    endDate?: string | null,
    startTime?: string | null,
    endTime?: string | null
}



export default class CalendarView extends ViewMode<{}> {

    private $root: JQuery<HTMLElement>;
    private $calendarContainer: JQuery<HTMLElement>;
    private calendar?: Calendar;
    private isCalendarRoot: boolean;

    constructor(args: ViewModeArgs) {
        super(args, "calendar");

        this.$root = $(TPL);
        this.$calendarContainer = this.$root.find(".calendar-container");
        this.isCalendarRoot = false;
        args.$parent.append(this.$root);
    }

    async renderList(): Promise<JQuery<HTMLElement> | undefined> {
        const { Calendar } = await import("@fullcalendar/core");

        let eventBuilder: EventSourceFunc;
        if (!this.isCalendarRoot) {
            eventBuilder = async () => await CalendarView.buildEvents(this.noteIds)
        } else {
            eventBuilder = async (e: EventSourceFuncArg) => await this.#buildEventsForCalendar(e);
        }

        const calendar = new Calendar(this.$calendarContainer[0], {
            events: eventBuilder,
            select: (e) => this.#onCalendarSelection(e),
            eventChange: (e) => this.#onEventMoved(e),
            height: "100%",
            nowIndicator: true,
            eventDidMount: (e) => {
                const { iconClass, promotedAttributes } = e.event.extendedProps;

                // Prepend the icon to the title, if any.
                if (iconClass) {
                    let titleContainer;
                    switch (e.view.type) {
                        case "timeGridWeek":
                        case "dayGridMonth":
                            titleContainer = e.el.querySelector(".fc-event-title");
                            break;
                        case "multiMonthYear":
                            break;
                        case "listMonth":
                            titleContainer = e.el.querySelector(".fc-list-event-title a");
                            break;
                    }

                    if (titleContainer) {
                        const icon = /*html*/`<span class="${iconClass}"></span> `;
                        titleContainer.insertAdjacentHTML("afterbegin", icon);
                    }
                }

                // Append promoted attributes to the end of the event container.
                if (promotedAttributes) {
                    let promotedAttributesHtml = "";
                    for (const [name, value] of promotedAttributes) {
                        promotedAttributesHtml = promotedAttributesHtml + /*html*/`\
                        <div class="promoted-attribute">
                            <span class="promoted-attribute-name">${name}</span>: <span class="promoted-attribute-value">${value}</span>
                        </div>`;
                    }

                    let mainContainer;
                    switch (e.view.type) {
                        case "timeGridWeek":
                        case "dayGridMonth":
                            mainContainer = e.el.querySelector(".fc-event-main");
                            break;
                        case "multiMonthYear":
                            break;
                        case "listMonth":
                            mainContainer = e.el.querySelector(".fc-list-event-title");
                            break;
                    }
                    $(mainContainer ?? e.el).append($(promotedAttributesHtml));
                }
            },
            // Called upon when clicking the day number in the calendar, opens or creates the day note but only if in a calendar root.
            dateClick: async (e) => {
                if (!this.isCalendarRoot) {
                    return;
                }

                const note = await date_notes.getDayNote(e.dateStr);
                if (note) {
                    appContext.triggerCommand("openInPopup", { noteIdOrPath: note.noteId });
                    appContext.triggerCommand("refreshNoteList", { noteId: this.parentNote.noteId });
                }
            },
            datesSet: (e) => this.#onDatesSet(e),
        });

        return this.$root;
    }

    #onDatesSet(e: DatesSetArg) {
        if (hasTouchBar) {
            appContext.triggerCommand("refreshTouchBar");
        }
    }

    async #onEventMoved(e: EventChangeArg) {
        // Handle start and end date
        let { startDate, endDate } = this.#parseStartEndDateFromEvent(e.event);
        if (!startDate) {
            return;
        }
        const noteId = e.event.extendedProps.noteId;

        // Don't store the end date if it's empty.
        if (endDate === startDate) {
            endDate = undefined;
        }

        // Update start date
        const note = await froca.getNote(noteId);
        if (!note) {
            return;
        }

        // Since they can be customized via calendar:startDate=$foo and calendar:endDate=$bar we need to determine the
        // attributes to be effectively updated
        const startAttribute = note.getAttributes("label").filter(attr => attr.name == "calendar:startDate").shift()?.value||"startDate";
        const endAttribute = note.getAttributes("label").filter(attr => attr.name == "calendar:endDate").shift()?.value||"endDate";

        attributes.setAttribute(note, "label", startAttribute, startDate);
        attributes.setAttribute(note, "label", endAttribute, endDate);

        // Update start time and end time if needed.
        if (!e.event.allDay) {
            const startAttribute = note.getAttributes("label").filter(attr => attr.name == "calendar:startTime").shift()?.value||"startTime";
            const endAttribute = note.getAttributes("label").filter(attr => attr.name == "calendar:endTime").shift()?.value||"endTime";

            const { startTime, endTime } = this.#parseStartEndTimeFromEvent(e.event);
            attributes.setAttribute(note, "label", startAttribute, startTime);
            attributes.setAttribute(note, "label", endAttribute, endTime);
        }
    }

    async onEntitiesReloaded({ loadResults }: EventData<"entitiesReloaded">) {
        // Refresh note IDs if they got changed.
        if (loadResults.getBranchRows().some((branch) => branch.parentNoteId === this.parentNote.noteId)) {
            this.noteIds = this.parentNote.getChildNoteIds();
        }

        // Refresh calendar on attribute change.
        if (loadResults.getAttributeRows().some((attribute) => attribute.noteId === this.parentNote.noteId && attribute.name?.startsWith("calendar:") && attribute.name !== "calendar:view")) {
            return true;
        }

        // Refresh on note title change.
        if (loadResults.getNoteIds().some(noteId => this.noteIds.includes(noteId))) {
            this.calendar?.refetchEvents();
        }

        // Refresh dataset on subnote change.
        if (loadResults.getAttributeRows().some((a) => this.noteIds.includes(a.noteId ?? ""))) {
            this.calendar?.refetchEvents();
        }
    }

    async #buildEventsForCalendar(e: EventSourceFuncArg) {
        const events: EventInput[] = [];

        // Gather all the required date note IDs.
        const dateRange = utils.getMonthsInDateRange(e.startStr, e.endStr);
        let allDateNoteIds: string[] = [];
        for (const month of dateRange) {
            // TODO: Deduplicate get type.
            const dateNotesForMonth = await server.get<Record<string, string>>(`special-notes/notes-for-month/${month}?calendarRoot=${this.parentNote.noteId}`);
            const dateNoteIds = Object.values(dateNotesForMonth);
            allDateNoteIds = [...allDateNoteIds, ...dateNoteIds];
        }

        // Request all the date notes.
        const dateNotes = await froca.getNotes(allDateNoteIds);
        const childNoteToDateMapping: Record<string, string> = {};
        for (const dateNote of dateNotes) {
            const startDate = dateNote.getLabelValue("dateNote");
            if (!startDate) {
                continue;
            }

            events.push(await CalendarView.buildEvent(dateNote, { startDate }));

            if (dateNote.hasChildren()) {
                const childNoteIds = await dateNote.getSubtreeNoteIds();
                for (const childNoteId of childNoteIds) {
                    childNoteToDateMapping[childNoteId] = startDate;
                }
            }
        }

        // Request all child notes of date notes in a single run.
        const childNoteIds = Object.keys(childNoteToDateMapping);
        const childNotes = await froca.getNotes(childNoteIds);
        for (const childNote of childNotes) {
            const startDate = childNoteToDateMapping[childNote.noteId];
            const event = await CalendarView.buildEvent(childNote, { startDate });
            events.push(event);
        }

        return events.flat();
    }

    static async buildEvents(noteIds: string[]) {
        const notes = await froca.getNotes(noteIds);
        const events: EventSourceInput = [];

        for (const note of notes) {
            const startDate = CalendarView.#getCustomisableLabel(note, "startDate", "calendar:startDate");

            if (!startDate) {
                continue;
            }

            const endDate = CalendarView.#getCustomisableLabel(note, "endDate", "calendar:endDate");
            const startTime = CalendarView.#getCustomisableLabel(note, "startTime", "calendar:startTime");
            const endTime = CalendarView.#getCustomisableLabel(note, "endTime", "calendar:endTime");
            events.push(await CalendarView.buildEvent(note, { startDate, endDate, startTime, endTime }));
        }

        return events.flat();
    }

    /**
     * Allows the user to customize the attribute from which to obtain a particular value. For example, if `customLabelNameAttribute` is `calendar:startDate`
     * and `defaultLabelName` is `startDate` and the note at hand has `#calendar:startDate=myStartDate #myStartDate=2025-02-26` then the value returned will
     * be `2025-02-26`. If there is no custom attribute value, then the value of the default attribute is returned instead (e.g. `#startDate`).
     *
     * @param note the note from which to read the values.
     * @param defaultLabelName the name of the label in case a custom value is not found.
     * @param customLabelNameAttribute the name of the label to look for a custom value.
     * @returns the value of either the custom label or the default label.
     */
    static #getCustomisableLabel(note: FNote, defaultLabelName: string, customLabelNameAttribute: string) {
        const customAttributeName = note.getLabelValue(customLabelNameAttribute);
        if (customAttributeName) {
            const customValue = note.getLabelValue(customAttributeName);
            if (customValue) {
                return customValue;
            }
        }

        return note.getLabelValue(defaultLabelName);
    }

    static async buildEvent(note: FNote, { startDate, endDate, startTime, endTime }: Event) {
        const customTitleAttributeName = note.getLabelValue("calendar:title");
        const titles = await CalendarView.#parseCustomTitle(customTitleAttributeName, note);
        const color = note.getLabelValue("calendar:color") ?? note.getLabelValue("color");
        const events: EventInput[] = [];

        const calendarDisplayedAttributes = note.getLabelValue("calendar:displayedAttributes")?.split(",");
        let displayedAttributesData: Array<[string, string]> | null = null;
        if (calendarDisplayedAttributes) {
            displayedAttributesData = await this.#buildDisplayedAttributes(note, calendarDisplayedAttributes);
        }

        for (const title of titles) {
            if (startTime && endTime && !endDate) {
                endDate = startDate;
            }

            startDate = (startTime ? `${startDate}T${startTime}:00` : startDate);
            if (!startTime) {
                const endDateOffset = CalendarView.#offsetDate(endDate ?? startDate, 1);
                if (endDateOffset) {
                    endDate = CalendarView.#formatDateToLocalISO(endDateOffset);
                }
            }

            endDate = (endTime ? `${endDate}T${endTime}:00` : endDate);
            const eventData: EventInput = {
                title: title,
                start: startDate,
                url: `#${note.noteId}?popup`,
                noteId: note.noteId,
                color: color ?? undefined,
                iconClass: note.getLabelValue("iconClass"),
                promotedAttributes: displayedAttributesData
            };
            if (endDate) {
                eventData.end = endDate;
            }
            events.push(eventData);
        }
        return events;
    }

    static async #buildDisplayedAttributes(note: FNote, calendarDisplayedAttributes: string[]) {
        const filteredDisplayedAttributes = note.getAttributes().filter((attr): boolean => calendarDisplayedAttributes.includes(attr.name))
        const result: Array<[string, string]> = [];

        for (const attribute of filteredDisplayedAttributes) {
            if (attribute.type === "label") result.push([attribute.name, attribute.value]);
            else result.push([attribute.name, (await attribute.getTargetNote())?.title || ""])
        }

        return result;
    }

    static async #parseCustomTitle(customTitlettributeName: string | null, note: FNote, allowRelations = true): Promise<string[]> {
        if (customTitlettributeName) {
            const labelValue = note.getAttributeValue("label", customTitlettributeName);
            if (labelValue) return [labelValue];

            if (allowRelations) {
                const relations = note.getRelations(customTitlettributeName);
                if (relations.length > 0) {
                    const noteIds = relations.map((r) => r.targetNoteId);
                    const notesFromRelation = await froca.getNotes(noteIds);
                    const titles: string[][] = [];

                    for (const targetNote of notesFromRelation) {
                        const targetCustomTitleValue = targetNote.getAttributeValue("label", "calendar:title");
                        const targetTitles = await CalendarView.#parseCustomTitle(targetCustomTitleValue, targetNote, false);
                        titles.push(targetTitles.flat());
                    }

                    return titles.flat();
                }
            }
        }

        return [note.title];
    }

    buildTouchBarCommand({ TouchBar, buildIcon }: CommandListenerData<"buildTouchBar">) {
        if (!this.calendar) {
            return;
        }

        const items: TouchBarItem[] = [];
        const $toolbarItems = this.$calendarContainer.find(".fc-toolbar-chunk .fc-button-group, .fc-toolbar-chunk > button");

        for (const item of $toolbarItems) {
            // Button groups.
            if (item.classList.contains("fc-button-group")) {
                let mode: "single" | "buttons" = "single";
                let selectedIndex = 0;
                const segments: SegmentedControlSegment[] = [];
                const subItems = item.childNodes as NodeListOf<HTMLElement>;
                let index = 0;
                for (const subItem of subItems) {
                    if (subItem.ariaPressed === "true") {
                        selectedIndex = index;
                    }
                    index++;

                    // Text button.
                    if (subItem.innerText) {
                        segments.push({ label: subItem.innerText });
                        continue;
                    }

                    // Icon button.
                    const iconEl = subItem.querySelector("span.fc-icon");
                    let icon: string | null = null;
                    if (iconEl?.classList.contains("fc-icon-chevron-left")) {
                        icon = "NSImageNameTouchBarGoBackTemplate";
                        mode = "buttons";
                    } else if (iconEl?.classList.contains("fc-icon-chevron-right")) {
                        icon = "NSImageNameTouchBarGoForwardTemplate";
                        mode = "buttons";
                    }

                    if (icon) {
                        segments.push({
                            icon: buildIcon(icon)
                        });
                    }
                }

                items.push(new TouchBar.TouchBarSegmentedControl({
                    mode,
                    segments,
                    selectedIndex,
                    change: (selectedIndex, isSelected) => subItems[selectedIndex].click()
                }));
                continue;
            }

            // Standalone item.
            if (item.innerText) {
                items.push(new TouchBar.TouchBarButton({
                    label: item.innerText,
                    click: () => item.click()
                }));
            }
        }

        return items;
    }

}
