import { Group, Pagination, Select, Space, Text } from '@mantine/core';
import { usePagination } from '../../../hooks/usePagination';

interface ListPaginationProps {
    totalPages: number;
    totalItems: number;
    itemsLabel: string;
}

const ITEMS_PER_PAGE_OPTIONS = ['15', '25', '50'].map((n) => ({
    value: n,
    label: `${n} rows`,
}));

export function ListPagination({ totalPages, totalItems, itemsLabel }: ListPaginationProps) {
    const { page, itemsPerPage, setPage, setItemsPerPage } = usePagination();

    const firstDisplayedElement = (page - 1) * itemsPerPage + 1;
    const lastDisplayedElement = Math.min(page * itemsPerPage, totalItems);

    return (
        <Group justify="space-between" mt="md">
            <Select
                size="sm"
                w={100}
                data={ITEMS_PER_PAGE_OPTIONS}
                value={String(itemsPerPage)}
                onChange={(v) => v && setItemsPerPage(Number(v))}
                allowDeselect={false}
            />
            <Group gap="md">
                <Text size="sm" c="dimmed">
                    {`${firstDisplayedElement} - ${lastDisplayedElement} of ${totalItems} ${itemsLabel}`}
                </Text>

                {totalPages > 1 && (
                    <>
                        <Space w="sm" />
                        <Pagination total={totalPages} value={page} onChange={setPage} size="sm" withEdges />
                    </>
                )}
            </Group>
        </Group>
    );
}
