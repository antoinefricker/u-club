import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Knex } from 'knex';
import { applyPagination, buildPaginationMeta } from './pagination.js';

type MockQueryBuilder = {
    clone: ReturnType<typeof vi.fn>;
    clearSelect: ReturnType<typeof vi.fn>;
    clearOrder: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    countDistinct: ReturnType<typeof vi.fn>;
    first: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
    offset: ReturnType<typeof vi.fn>;
    then: ReturnType<typeof vi.fn>;
};

function createMockQuery(
    rows: unknown[],
    total: number | string,
): MockQueryBuilder {
    const countQuery = {
        clearSelect: vi.fn().mockReturnThis(),
        clearOrder: vi.fn().mockReturnThis(),
        count: vi.fn().mockReturnThis(),
        countDistinct: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ total }),
    };
    const dataQuery = {
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(rows),
    };
    return {
        clone: vi.fn(() => countQuery),
        ...countQuery,
        ...dataQuery,
        then: vi.fn(),
    } as unknown as MockQueryBuilder;
}

describe('applyPagination', () => {
    let rows: Array<{ id: string }>;
    let query: MockQueryBuilder;

    beforeEach(() => {
        rows = [{ id: 'a' }, { id: 'b' }];
        query = createMockQuery(rows, 42);
    });

    it('returns data and totalItems', async () => {
        const result = await applyPagination<{ id: string }>(
            query as unknown as Knex.QueryBuilder,
            { page: 1, itemsPerPage: 25 },
        );
        expect(result).toEqual({ data: rows, totalItems: 42 });
    });

    it('applies limit and offset for page 1', async () => {
        await applyPagination(query as unknown as Knex.QueryBuilder, {
            page: 1,
            itemsPerPage: 25,
        });
        expect(query.limit).toHaveBeenCalledWith(25);
        expect(query.offset).toHaveBeenCalledWith(0);
    });

    it('applies limit and offset for page 3 with size 10', async () => {
        await applyPagination(query as unknown as Knex.QueryBuilder, {
            page: 3,
            itemsPerPage: 10,
        });
        expect(query.limit).toHaveBeenCalledWith(10);
        expect(query.offset).toHaveBeenCalledWith(20);
    });

    it('uses count(*) by default on the cloned query', async () => {
        await applyPagination(query as unknown as Knex.QueryBuilder, {
            page: 1,
            itemsPerPage: 25,
        });
        expect(query.clone).toHaveBeenCalled();
        const cloned = query.clone.mock.results[0].value;
        expect(cloned.clearSelect).toHaveBeenCalled();
        expect(cloned.clearOrder).toHaveBeenCalled();
        expect(cloned.count).toHaveBeenCalledWith({ total: '*' });
        expect(cloned.countDistinct).not.toHaveBeenCalled();
    });

    it('uses countDistinct when distinctColumn is provided', async () => {
        await applyPagination(
            query as unknown as Knex.QueryBuilder,
            { page: 1, itemsPerPage: 25 },
            { distinctColumn: 'members.id' },
        );
        const cloned = query.clone.mock.results[0].value;
        expect(cloned.countDistinct).toHaveBeenCalledWith({
            total: 'members.id',
        });
        expect(cloned.count).not.toHaveBeenCalled();
    });

    it('coerces string total to number', async () => {
        const q = createMockQuery([], '0');
        const result = await applyPagination<{ id: string }>(
            q as unknown as Knex.QueryBuilder,
            { page: 1, itemsPerPage: 25 },
        );
        expect(result.totalItems).toBe(0);
    });

    it('returns totalItems = 0 when count row is missing', async () => {
        const q = createMockQuery([], 0);
        const cloned = q.clone();
        (cloned.first as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
            undefined,
        );
        const result = await applyPagination<{ id: string }>(
            q as unknown as Knex.QueryBuilder,
            { page: 1, itemsPerPage: 25 },
        );
        expect(result.totalItems).toBe(0);
    });
});

describe('buildPaginationMeta', () => {
    it('computes totalPages with exact division', () => {
        expect(
            buildPaginationMeta({ page: 1, itemsPerPage: 10, totalItems: 30 }),
        ).toEqual({ page: 1, itemsPerPage: 10, totalItems: 30, totalPages: 3 });
    });

    it('computes totalPages with remainder (partial last page)', () => {
        expect(
            buildPaginationMeta({ page: 1, itemsPerPage: 10, totalItems: 31 }),
        ).toEqual({ page: 1, itemsPerPage: 10, totalItems: 31, totalPages: 4 });
    });

    it('returns totalPages = 1 when totalItems is 0', () => {
        expect(
            buildPaginationMeta({ page: 1, itemsPerPage: 25, totalItems: 0 }),
        ).toEqual({ page: 1, itemsPerPage: 25, totalItems: 0, totalPages: 1 });
    });

    it('returns totalPages = 1 when totalItems < itemsPerPage', () => {
        expect(
            buildPaginationMeta({ page: 1, itemsPerPage: 25, totalItems: 3 }),
        ).toEqual({ page: 1, itemsPerPage: 25, totalItems: 3, totalPages: 1 });
    });

    it('preserves page param even when beyond totalPages', () => {
        expect(
            buildPaginationMeta({ page: 99, itemsPerPage: 10, totalItems: 5 }),
        ).toEqual({ page: 99, itemsPerPage: 10, totalItems: 5, totalPages: 1 });
    });
});
