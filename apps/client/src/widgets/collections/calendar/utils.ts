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
