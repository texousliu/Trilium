import { DateSelectArg } from "@fullcalendar/core/index.js";
import { EventImpl } from "@fullcalendar/core/internal";

export function parseStartEndDateFromEvent(e: DateSelectArg | EventImpl) {
    const startDate = formatDateToLocalISO(e.start);
    if (!startDate) {
        return { startDate: null, endDate: null };
    }
    let endDate;
    if (e.allDay) {
        endDate = formatDateToLocalISO(offsetDate(e.end, -1));
    } else {
        endDate = formatDateToLocalISO(e.end);
    }
    return { startDate, endDate };
}

export function parseStartEndTimeFromEvent(e: DateSelectArg | EventImpl) {
    let startTime: string | undefined | null = null;
    let endTime: string | undefined | null = null;
    if (!e.allDay) {
        startTime = formatTimeToLocalISO(e.start);
        endTime = formatTimeToLocalISO(e.end);
    }

    return { startTime, endTime };
}

export function formatDateToLocalISO(date: Date | null | undefined) {
    if (!date) {
        return undefined;
    }

    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split("T")[0];
}

export function offsetDate(date: Date | string | null | undefined, offset: number) {
    if (!date) {
        return undefined;
    }

    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + offset);
    return newDate;
}

export function formatTimeToLocalISO(date: Date | null | undefined) {
    if (!date) {
        return undefined;
    }

    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString()
        .split("T")[1]
        .substring(0, 5);
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
export function getCustomisableLabel(note: FNote, defaultLabelName: string, customLabelNameAttribute: string) {
    const customAttributeName = note.getLabelValue(customLabelNameAttribute);
    if (customAttributeName) {
        const customValue = note.getLabelValue(customAttributeName);
        if (customValue) {
            return customValue;
        }
    }

    return note.getLabelValue(defaultLabelName);
}
