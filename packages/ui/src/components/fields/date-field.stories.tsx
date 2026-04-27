/**
 * Storybook catalog for `<DateField>` + `<RhfDateField>`.
 *
 * Platform-extension: web uses the native `<input type="date">`;
 * native uses a brand-styled `<Modal>` + Combobox triplet. Storybook
 * resolves the web variant via Vite. Audit Round 2 G2.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { View } from '@tamagui/core';
import { Btn } from '../Btn/index';
import { DateField } from './date-field';
import { RhfDateField } from './controlled';

const meta: Meta<typeof DateField> = {
  title: 'Phase 1A / Fields / DateField',
  component: DateField,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof DateField>;

/** Plain controlled — empty state, native picker on focus. */
export const Empty: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <View padding={16} width={360}>
        <DateField label="Fecha de la venta" value={value} onChange={setValue} />
      </View>
    );
  },
};

/** Pre-filled with today's date. */
export const Today: Story = {
  render: () => {
    const today = new Date().toISOString().slice(0, 10);
    const [value, setValue] = useState(today);
    return (
      <View padding={16} width={360}>
        <DateField label="Fecha" value={value} onChange={setValue} />
      </View>
    );
  },
};

interface CorteForm {
  readonly fecha: string;
}

/** RHF wrapper — `<RhfDateField control={control} name="fecha" />`. */
export const RhfControlled: Story = {
  render: () => {
    const { control, handleSubmit } = useForm<CorteForm>({
      defaultValues: { fecha: '2026-04-26' },
    });
    return (
      <View padding={16} width={360} gap={12}>
        <RhfDateField control={control} name="fecha" label="Fecha del corte" />
        <Btn onPress={handleSubmit(() => {})}>CERRAR CORTE</Btn>
      </View>
    );
  },
};
