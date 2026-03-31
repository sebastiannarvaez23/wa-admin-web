export const DEFAULT_PAGE_SIZE = 10;

export interface PaginatedResponse<T> {
    items:       T[];
    total:       number;
    page:        number;
    page_size:   number;
    total_pages: number;
}

/**
 * Returns the display number for a row in a paginated table.
 * Page 1 → 1..10, Page 2 → 11..20, etc.
 */
export function rowNumber(currentPage: number, pageSize: number, index: number): number {
    return (currentPage - 1) * pageSize + index + 1;
}
