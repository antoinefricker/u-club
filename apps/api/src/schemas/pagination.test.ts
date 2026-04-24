import { describe, it, expect } from 'vitest';
import {
    DEFAULT_ITEMS_PER_PAGE,
    DEFAULT_PAGE,
    MAX_ITEMS_PER_PAGE,
    paginationQuerySchema,
} from './pagination.js';

describe('paginationQuerySchema', () => {
    it('applies defaults when no query params are present', () => {
        const result = paginationQuerySchema.parse({});
        expect(result).toEqual({
            page: DEFAULT_PAGE,
            itemsPerPage: DEFAULT_ITEMS_PER_PAGE,
        });
    });

    it('coerces string values from req.query', () => {
        const result = paginationQuerySchema.parse({
            page: '3',
            itemsPerPage: '50',
        });
        expect(result).toEqual({ page: 3, itemsPerPage: 50 });
    });

    it('accepts numeric values as-is', () => {
        const result = paginationQuerySchema.parse({
            page: 2,
            itemsPerPage: 10,
        });
        expect(result).toEqual({ page: 2, itemsPerPage: 10 });
    });

    it('rejects non-numeric strings', () => {
        const result = paginationQuerySchema.safeParse({ page: 'abc' });
        expect(result.success).toBe(false);
    });

    it('rejects page < 1', () => {
        const result = paginationQuerySchema.safeParse({ page: 0 });
        expect(result.success).toBe(false);
    });

    it('rejects negative page', () => {
        const result = paginationQuerySchema.safeParse({ page: -1 });
        expect(result.success).toBe(false);
    });

    it('rejects non-integer page', () => {
        const result = paginationQuerySchema.safeParse({ page: 1.5 });
        expect(result.success).toBe(false);
    });

    it('rejects itemsPerPage < 1', () => {
        const result = paginationQuerySchema.safeParse({ itemsPerPage: 0 });
        expect(result.success).toBe(false);
    });

    it(`rejects itemsPerPage > ${MAX_ITEMS_PER_PAGE}`, () => {
        const result = paginationQuerySchema.safeParse({
            itemsPerPage: MAX_ITEMS_PER_PAGE + 1,
        });
        expect(result.success).toBe(false);
    });

    it(`accepts itemsPerPage = ${MAX_ITEMS_PER_PAGE}`, () => {
        const result = paginationQuerySchema.parse({
            itemsPerPage: MAX_ITEMS_PER_PAGE,
        });
        expect(result.itemsPerPage).toBe(MAX_ITEMS_PER_PAGE);
    });

    it('ignores unknown query params', () => {
        const result = paginationQuerySchema.parse({
            page: 2,
            itemsPerPage: 10,
            clubId: 'abc',
        });
        expect(result).toEqual({ page: 2, itemsPerPage: 10 });
    });
});
