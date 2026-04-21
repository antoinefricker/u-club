import { Group } from '@mantine/core';
import type { ReactNode } from 'react';

interface ListFilterProps {
  children: ReactNode;
}

export function ListFilter({ children }: ListFilterProps) {
  return (
    <Group gap="md" align="flex-end" mb="md">
      {children}
    </Group>
  );
}
