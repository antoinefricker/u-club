import { TextInput, type TextInputProps } from '@mantine/core';
import { IconPhone } from '@tabler/icons-react';
import { formatPhone } from '../validations/phoneValidation';

interface PhoneInputProps extends Omit<TextInputProps, 'onChange'> {
  onChange?: (value: string) => void;
}

export function PhoneInput({ onChange, ...props }: PhoneInputProps) {
  return (
    <TextInput
      label="Phone"
      placeholder="0 00 00 00 00"
      leftSection={
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 14,
            color: 'var(--mantine-color-dimmed)',
          }}
        >
          <IconPhone size={16} />
          +33 (0)
        </span>
      }
      leftSectionWidth={78}
      {...props}
      onChange={(e) => onChange?.(formatPhone(e.target.value))}
    />
  );
}
