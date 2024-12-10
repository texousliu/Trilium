/**
 * Formats the given date and time to a string based on the current locale.
 * @param {string | Date | number} date 
 * @param {"full" | "long" | "medium" | "short" | "none" | undefined} dateStyle 
 * @param {"full" | "long" | "medium" | "short" | "none" | undefined} timeStyle 
 */
export function formatDateTime(date, dateStyle = "medium", timeStyle = "medium") {
    const locale = navigator.language;

    let parsedDate;
    if (typeof date === "string") {
        // Parse the given string as a date
        parsedDate = new Date(date);
    } else if (typeof date === "number" || date instanceof Date) {
        // The given date is already a Date instance or a number
        parsedDate = date;
    } else {
        // Invalid type
        throw new TypeError(`Invalid type for the "date" argument.`);
    };

    if (timeStyle === "none") {
        // Format only the date
        return parsedDate.toLocaleDateString(locale, {dateStyle});
    } else if (dateStyle === "none") {
        // Format only the time
        return parsedDate.toLocaleTimeString(locale, {timeStyle});
    } else {
        // Format the date and time
        const formatter = new Intl.DateTimeFormat(navigator.language, {dateStyle, timeStyle});
        return formatter.format(parsedDate);
    }
}

