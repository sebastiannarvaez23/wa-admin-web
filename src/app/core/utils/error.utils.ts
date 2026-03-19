/**
 * Extracts a human-readable error message from an HttpErrorResponse.
 * Checks for `error.detail` or the first field-level error, falling back
 * to the provided fallback string.
 */
export function extractError(err: unknown, fallback: string): string {
    const error = err as { error?: { detail?: string; [key: string]: unknown } };
    if (error?.error?.detail) return error.error.detail;
    if (error?.error && typeof error.error === 'object') {
        const key = Object.keys(error.error)[0];
        if (key) {
            const v = error.error[key];
            return Array.isArray(v) ? (v as string[])[0] : String(v);
        }
    }
    return fallback;
}
