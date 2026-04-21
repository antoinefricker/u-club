import { Table, Text } from '@mantine/core';

interface EmptyListRowProps {
  colSpan: number;
  message?: string;
}

export function EmptyListRow({
  colSpan,
  message = 'No results',
}: EmptyListRowProps) {
  return (
    <Table.Tr>
      <Table.Td colSpan={colSpan}>
        <Text c="dimmed" py="xl">
          {message}
        </Text>
      </Table.Td>
    </Table.Tr>
  );
}
