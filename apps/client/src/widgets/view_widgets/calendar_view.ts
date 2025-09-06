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


export default class CalendarView extends ViewMode<{}> {

    private $root: JQuery<HTMLElement>;
    private $calendarContainer: JQuery<HTMLElement>;
    private calendar?: Calendar;
    private isCalendarRoot: boolean;

    constructor(args: ViewModeArgs) {
        super(args, "calendar");

        this.$root = $(TPL);
        this.$calendarContainer = this.$root.find(".calendar-container");
        args.$parent.append(this.$root);
    }

    async renderList(): Promise<JQuery<HTMLElement> | undefined> {
        const calendar = new Calendar(this.$calendarContainer[0], {
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
