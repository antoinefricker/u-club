export type PaginationMeta = {
    page: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
};

export type Paginated<T> = {
    data: T[];
    pagination: PaginationMeta;
};

export type PaginationArgs = {
    page?: number;
    itemsPerPage?: number;
};

export function buildListQueryString(params: Record<string, string | number | undefined | null>): string {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value == null || value === '') continue;
        search.set(key, String(value));
    }
    const qs = search.toString();
    return qs ? `?${qs}` : '';
}
