import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

type FilterValues<K extends readonly string[]> = {
    [P in K[number]]?: string;
};

type UseListFiltersReturn<K extends readonly string[]> = {
    filters: FilterValues<K>;
    setFilter: <P extends K[number]>(key: P, value: string | null) => void;
    setFilters: (next: FilterValues<K>) => void;
    clearFilters: () => void;
};

export function useListFilters<K extends readonly string[]>(keys: K): UseListFiltersReturn<K> {
    const [searchParams, setSearchParams] = useSearchParams();

    const filters = useMemo(() => {
        const result: Record<string, string | undefined> = {};
        for (const key of keys) {
            const val = searchParams.get(key);
            if (val != null && val !== '') result[key] = val;
        }
        return result as FilterValues<K>;
    }, [searchParams, keys]);

    const setFilter = useCallback(
        <P extends K[number]>(key: P, value: string | null) => {
            const nextParams = new URLSearchParams(searchParams);
            if (value == null || value === '') {
                nextParams.delete(key);
            } else {
                nextParams.set(key, value);
            }
            nextParams.delete('page');
            setSearchParams(nextParams, { replace: true });
        },
        [searchParams, setSearchParams],
    );

    const setFilters = useCallback(
        (next: FilterValues<K>) => {
            const nextParams = new URLSearchParams(searchParams);
            for (const key of keys) {
                const value = next[key as K[number]];
                if (value == null || value === '') {
                    nextParams.delete(key);
                } else {
                    nextParams.set(key, value);
                }
            }
            nextParams.delete('page');
            setSearchParams(nextParams, { replace: true });
        },
        [searchParams, setSearchParams, keys],
    );

    const clearFilters = useCallback(() => {
        const nextParams = new URLSearchParams(searchParams);
        for (const key of keys) nextParams.delete(key);
        nextParams.delete('page');
        setSearchParams(nextParams, { replace: true });
    }, [searchParams, setSearchParams, keys]);

    return { filters, setFilter, setFilters, clearFilters };
}
