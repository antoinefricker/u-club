import { Text, type TextProps } from '@mantine/core';

export const InputHelper = ({
    children,
    c = 'dimmed',
    mt = 4,
    fs = 'italic',
    size = 'xs',
    ...props
}: TextProps & { children: string }) => (
    <Text size={size} c={c} mt={mt} fs={fs} {...props}>
        {children}
    </Text>
);
