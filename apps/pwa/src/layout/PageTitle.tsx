import { Group, Title } from '@mantine/core';
import type { ReactNode } from 'react';

interface PageTitleProps {
  children?: ReactNode;
  label: string;
}

export function PageTitle({ children, label }: PageTitleProps) {
  return (
    <div>
      <Group justify="space-between">
        <Title order={2} mb="md">
          {label}
        </Title>
        <div>{children}</div>
      </Group>
    </div>
  );
}
