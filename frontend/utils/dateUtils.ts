import { formatDistanceToNow as primitiveFormatDistanceToNow, isValid } from "date-fns";

/**
 * Safely format distance to now, preventing "Invalid time value" crashes.
 * returns "just now" if date is invalid.
 */
export function formatDistanceToNow(date: Date | string | number | null | undefined, options?: { addSuffix?: boolean }): string {
    if (!date) return "just now";

    const dateObj = (date instanceof Date) ? date : new Date(date);

    if (!isValid(dateObj)) {
        return "just now";
    }

    return primitiveFormatDistanceToNow(dateObj, options);
}
