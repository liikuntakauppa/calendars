
/**
 * Returns the ISO week number and year of the given date (or of today if omitted) as a tuple.
 *
 * Source: https://bito.ai/resources/javascript-get-week-number-javascript-explained/
 * @returns ISO week number of today
 */
export const getWeekNumber = (date: Date = new Date()): [number, number] => {
    const d: Date = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    // Set to nearest Thursday: current date + 4 - current day number. Make Sunday's day number 7.
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    // Get first day of year
    let yearStart: Date = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    // Calculate full weeks to nearest Thursday
    let weekNo = Math.ceil(( ( (d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
    // Return array of year and week number
    return [d.getUTCFullYear(), weekNo];
}
