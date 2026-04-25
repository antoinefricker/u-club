import classes from './FormWrapper.module.css';

import { Box } from '@mantine/core';
import type { ReactNode } from 'react';

interface FormWrapperProps {
    children: ReactNode;
}

export function FormWrapper({ children }: FormWrapperProps) {
    return (
        <Box maw={900} mt="md" className={classes.root}>
            {children}
        </Box>
    );
}
