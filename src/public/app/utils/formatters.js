/**
 * Formats the given date to a string based on the current locale.
 * @param {Date | number} date 
 * @param {"full" | "long" | "medium" | "short" | "none" | undefined} dateStyle 
 * @param {"full" | "long" | "medium" | "short" | "none" | undefined} tiemStyle 
 */
export function formatDate(date, dateStyle = "medium", timeStyle = "medium") {
    const locale = navigator.language;

    if (timeStyle === "none") {
        // Format only the date
        return date.toLocaleDateString(locale, {dateStyle});
    } else if (dateStyle === "none") {
        // Format only the time
        return date.toLocaleTimeString(locale, {timeStyle});
    } else {
        // Format the date and time
        const formatter = new Intl.DateTimeFormat(navigator.language, {dateStyle, timeStyle});
        return formatter.format(date);
    }
}

