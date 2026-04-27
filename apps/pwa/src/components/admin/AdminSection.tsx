import { Box, Card, Title } from '@mantine/core';
import type { PropsWithChildren } from 'react';

export const AdminSection = ({ title, children }: PropsWithChildren<{ title: string }>) => {
    return (
        <Card shadow="sm" withBorder mb="lg" p={0}>
            <Box bg="brand.4" px="md" c="white">
                <Title order={3} my="md">
                    {title}
                </Title>
            </Box>
            <Box p="md">{children}</Box>
        </Card>
    );
};
