import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

export const DEFAULT_PAGE = 1;
export const DEFAULT_ITEMS_PER_PAGE = 25;
export const MAX_ITEMS_PER_PAGE = 100;

type UsePaginationReturn = {
  page: number;
  itemsPerPage: number;
  setPage: (page: number) => void;
  setItemsPerPage: (n: number) => void;
  resetPage: () => void;
};

function parsePage(raw: string | null): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) return DEFAULT_PAGE;
  return n;
}

function parseItemsPerPage(raw: string | null): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > MAX_ITEMS_PER_PAGE) {
    return DEFAULT_ITEMS_PER_PAGE;
  }
  return n;
}

export function usePagination(): UsePaginationReturn {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePage(searchParams.get('page'));
  const itemsPerPage = parseItemsPerPage(searchParams.get('itemsPerPage'));

  const setPage = useCallback(
    (next: number) => {
      const nextParams = new URLSearchParams(searchParams);
      if (next === DEFAULT_PAGE) {
        nextParams.delete('page');
      } else {
        nextParams.set('page', String(next));
      }
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const setItemsPerPage = useCallback(
    (next: number) => {
      const nextParams = new URLSearchParams(searchParams);
      if (next === DEFAULT_ITEMS_PER_PAGE) {
        nextParams.delete('itemsPerPage');
      } else {
        nextParams.set('itemsPerPage', String(next));
      }
      nextParams.delete('page');
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const resetPage = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('page');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  return { page, itemsPerPage, setPage, setItemsPerPage, resetPage };
}
