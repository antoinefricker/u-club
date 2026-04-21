import type { Knex } from 'knex';

export type PaginationInput = {
  page: number;
  itemsPerPage: number;
};

export type PaginationMeta = PaginationInput & {
  totalItems: number;
  totalPages: number;
};

export type ApplyPaginationOptions = {
  /**
   * Column to DISTINCT on when counting. Set when joins can multiply rows
   * (e.g. a member joined to many teamAssignments). Defaults to plain count(*).
   */
  distinctColumn?: string;
};

export async function applyPagination<T>(
  query: Knex.QueryBuilder,
  { page, itemsPerPage }: PaginationInput,
  options: ApplyPaginationOptions = {},
): Promise<{ data: T[]; totalItems: number }> {
  const countQuery = query.clone().clearSelect().clearOrder();

  if (options.distinctColumn) {
    countQuery.countDistinct({ total: options.distinctColumn });
  } else {
    countQuery.count({ total: '*' });
  }

  const countRow = await countQuery.first<{ total: string | number }>();
  const totalItems = Number(countRow?.total ?? 0);

  const data = (await query
    .limit(itemsPerPage)
    .offset((page - 1) * itemsPerPage)) as T[];

  return { data, totalItems };
}

export function buildPaginationMeta({
  page,
  itemsPerPage,
  totalItems,
}: PaginationInput & { totalItems: number }): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  return { page, itemsPerPage, totalItems, totalPages };
}
