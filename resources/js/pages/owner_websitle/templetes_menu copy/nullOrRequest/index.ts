/**
 * Checks if a value is null, undefined, or representing a null/undefined string (e.g. 'null', 'undefined', '').
 */
export function isNullOrFalsy(value: any): boolean {
    if (value === null || value === undefined) return true;
    const str = String(value).trim();
    return str === '' || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined';
}

/**
 * Normalizes a value. If it is null/falsy, it returns null (for setting values to null/empty).
 * Otherwise, it returns the parsed/raw value as any.
 */
export function nullOrRequest(value: any): any {
    if (isNullOrFalsy(value)) {
        return null;
    }
    // Return parsed number if numeric
    const num = Number(value);
    if (!isNaN(num) && String(value).trim() !== '') {
        return num;
    }
    return value;
}

/**
 * Normalizes a value. If it is null/falsy, returns undefined to 'request all'.
 * Otherwise, returns the parsed value as any.
 */
export function nullOrRequestAll(value: any): any {
    const res = nullOrRequest(value);
    return res === null ? undefined : res;
}
