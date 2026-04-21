import { Group } from '@mantine/core';
import type { ReactNode } from 'react';

interface ListFiltersProps {
  children: ReactNode;
}

export function ListFilters({ children }: ListFiltersProps) {
  return (
    <Group gap="md" align="flex-end" mb="md">
      {children}
    </Group>
  );
}
