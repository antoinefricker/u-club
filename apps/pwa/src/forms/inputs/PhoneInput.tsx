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
      placeholder="00 00 00 00 00"
      leftSection={<IconPhone size={16} />}
      {...props}
      onChange={(e) => onChange?.(formatPhone(e.target.value))}
    />
  );
}
