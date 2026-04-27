/**
 * Storybook catalog for `<PhoneField>` + `<RhfPhoneField>`.
 *
 * Drives the `phone-pad` keyboard and `autoComplete="tel"`. No
 * formatting is applied — Mexican numbers vary in shape and the form
 * Zod schema validates submit-time. Audit Round 2 G2.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { View } from '@tamagui/core';
import { Btn } from '../Btn/index';
import { PhoneField } from './phone-field';
import { RhfPhoneField } from './controlled';

const meta: Meta<typeof PhoneField> = {
  title: 'Phase 1A / Fields / PhoneField',
  component: PhoneField,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof PhoneField>;

/** Empty — placeholder shows the canonical 10-digit shape. */
export const Empty: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <View padding={16} width={360}>
        <PhoneField label="Teléfono" value={value} onChange={setValue} />
      </View>
    );
  },
};

/** Pre-filled with a 10-digit Mexican number. */
export const PreFilled: Story = {
  render: () => {
    const [value, setValue] = useState('5512345678');
    return (
      <View padding={16} width={360}>
        <PhoneField label="Teléfono" value={value} onChange={setValue} />
      </View>
    );
  },
};

interface ClienteForm {
  readonly telefono: string;
}

/** RHF wrapper — cliente create form row. */
export const RhfControlled: Story = {
  render: () => {
    const { control, handleSubmit } = useForm<ClienteForm>({
      defaultValues: { telefono: '' },
    });
    return (
      <View padding={16} width={360} gap={12}>
        <RhfPhoneField control={control} name="telefono" label="Teléfono (opcional)" />
        <Btn onPress={handleSubmit(() => {})}>GUARDAR CLIENTE</Btn>
      </View>
    );
  },
};
