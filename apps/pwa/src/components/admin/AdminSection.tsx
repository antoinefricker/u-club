import { Box, Card, Group, Title } from '@mantine/core';
import type { PropsWithChildren, ReactNode } from 'react';

type AdminSectionProps = PropsWithChildren<{
    title: string;
    actionButtons?: ReactNode[];
}>;

export const AdminSection = ({ title, actionButtons, children }: AdminSectionProps) => {
    return (
        <Card shadow="sm" withBorder mb="lg" p={0}>
            <Box bg="brand.4" px="md" c="white">
                <Group justify="space-between" align="center" my="md" wrap="nowrap">
                    <Title order={3}>{title}</Title>
                    {actionButtons && actionButtons.length > 0 && (
                        <Group gap="xs" wrap="nowrap">
                            {actionButtons}
                        </Group>
                    )}
                </Group>
            </Box>
            <Box p="md">{children}</Box>
        </Card>
    );
};
