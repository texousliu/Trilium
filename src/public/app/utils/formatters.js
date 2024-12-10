/**
 * Formats the given date to a string based on the current locale.
 * @param {Date | number} date 
 * @param {"full" | "long" | "medium" | "short" | undefined} dateStyle 
 * @param {"full" | "long" | "medium" | "short" | undefined} tiemStyle 
 */
export function formatDate(date, dateStyle = "medium", tiemStyle = "medium") {
    const formatter = new Intl.DateTimeFormat(navigator.language, {
        dateStyle: "medium",
        timeStyle: "medium"
    });

    return formatter.format(date);
}