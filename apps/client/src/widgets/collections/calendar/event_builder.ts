import { EventInput, EventSourceInput } from "@fullcalendar/core/index.js";
import froca from "../../../services/froca";
import { formatDateToLocalISO, getCustomisableLabel, offsetDate } from "./utils";
import FNote from "../../../entities/fnote";

interface Event {
    startDate: string,
    endDate?: string | null,
    startTime?: string | null,
    endTime?: string | null
}

export async function buildEvents(noteIds: string[]) {
    const notes = await froca.getNotes(noteIds);
    const events: EventSourceInput = [];

    for (const note of notes) {
        const startDate = getCustomisableLabel(note, "startDate", "calendar:startDate");

        if (!startDate) {
            continue;
        }

        const endDate = getCustomisableLabel(note, "endDate", "calendar:endDate");
        const startTime = getCustomisableLabel(note, "startTime", "calendar:startTime");
        const endTime = getCustomisableLabel(note, "endTime", "calendar:endTime");
        events.push(await buildEvent(note, { startDate, endDate, startTime, endTime }));
    }

    return events.flat();
}

async function buildEvent(note: FNote, { startDate, endDate, startTime, endTime }: Event) {
    const customTitleAttributeName = note.getLabelValue("calendar:title");
    const titles = await parseCustomTitle(customTitleAttributeName, note);
    const color = note.getLabelValue("calendar:color") ?? note.getLabelValue("color");
    const events: EventInput[] = [];

    const calendarDisplayedAttributes = note.getLabelValue("calendar:displayedAttributes")?.split(",");
    let displayedAttributesData: Array<[string, string]> | null = null;
    if (calendarDisplayedAttributes) {
        displayedAttributesData = await buildDisplayedAttributes(note, calendarDisplayedAttributes);
    }

    for (const title of titles) {
        if (startTime && endTime && !endDate) {
            endDate = startDate;
        }

        startDate = (startTime ? `${startDate}T${startTime}:00` : startDate);
        if (!startTime) {
            const endDateOffset = offsetDate(endDate ?? startDate, 1);
            if (endDateOffset) {
                endDate = formatDateToLocalISO(endDateOffset);
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

async function parseCustomTitle(customTitlettributeName: string | null, note: FNote, allowRelations = true): Promise<string[]> {
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
                    const targetTitles = await parseCustomTitle(targetCustomTitleValue, targetNote, false);
                    titles.push(targetTitles.flat());
                }

                return titles.flat();
            }
        }
    }

    return [note.title];
}

async function buildDisplayedAttributes(note: FNote, calendarDisplayedAttributes: string[]) {
    const filteredDisplayedAttributes = note.getAttributes().filter((attr): boolean => calendarDisplayedAttributes.includes(attr.name))
    const result: Array<[string, string]> = [];

    for (const attribute of filteredDisplayedAttributes) {
        if (attribute.type === "label") result.push([attribute.name, attribute.value]);
        else result.push([attribute.name, (await attribute.getTargetNote())?.title || ""])
    }

    return result;
}
