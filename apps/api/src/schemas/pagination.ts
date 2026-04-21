import { z } from 'zod';

export const DEFAULT_PAGE = 1;
export const DEFAULT_ITEMS_PER_PAGE = 25;
export const MAX_ITEMS_PER_PAGE = 100;

export const paginationQuerySchema = z.object({
  page: z.coerce
    .number({ error: 'page must be a number' })
    .int({ error: 'page must be an integer' })
    .min(1, { error: 'page must be >= 1' })
    .default(DEFAULT_PAGE),
  itemsPerPage: z.coerce
    .number({ error: 'itemsPerPage must be a number' })
    .int({ error: 'itemsPerPage must be an integer' })
    .min(1, { error: 'itemsPerPage must be >= 1' })
    .max(MAX_ITEMS_PER_PAGE, {
      error: `itemsPerPage must be <= ${MAX_ITEMS_PER_PAGE}`,
    })
    .default(DEFAULT_ITEMS_PER_PAGE),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
