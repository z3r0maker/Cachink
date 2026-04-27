/**
 * Storybook catalog for `<MoneyField>` + `<RhfMoneyField>`.
 *
 * Money inputs are the highest-stakes form primitive in the app
 * (CLAUDE.md §2 principle 8: money is never a float). The stories
 * below demo the controlled string variant and the RHF wrapper.
 * Audit Round 2 G2.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { View } from '@tamagui/core';
import { Btn } from '../Btn/index';
import { MoneyField } from './money-field';
import { RhfMoneyField } from './controlled';

const meta: Meta<typeof MoneyField> = {
  title: 'Phase 1A / Fields / MoneyField',
  component: MoneyField,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof MoneyField>;

/** Plain controlled — `decimal-pad` keyboard, formats on blur. */
export const Empty: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <View padding={16} width={360}>
        <MoneyField label="Monto" value={value} onChange={setValue} />
      </View>
    );
  },
};

/** Pre-filled — re-formats on blur via `formatPesos()`. */
export const PreFilled: Story = {
  render: () => {
    const [value, setValue] = useState('1234.56');
    return (
      <View padding={16} width={360}>
        <MoneyField label="Monto" value={value} onChange={setValue} />
      </View>
    );
  },
};

interface VentaForm {
  readonly monto: string;
}

/** RHF wrapper — `<RhfMoneyField control={control} name="monto" />`. */
export const RhfControlled: Story = {
  render: () => {
    const { control, handleSubmit } = useForm<VentaForm>({
      defaultValues: { monto: '' },
    });
    return (
      <View padding={16} width={360} gap={12}>
        <RhfMoneyField
          control={control}
          name="monto"
          label="Monto de la venta"
          placeholder="0.00"
        />
        <Btn onPress={handleSubmit(() => {})}>REGISTRAR VENTA</Btn>
      </View>
    );
  },
};

/** With error message — the RHF wrapper surfaces it via the `note` slot. */
export const WithError: Story = {
  render: () => {
    const { control } = useForm<VentaForm>({ defaultValues: { monto: '0' } });
    return (
      <View padding={16} width={360}>
        <RhfMoneyField
          control={control}
          name="monto"
          label="Monto"
          errorMessage="El monto debe ser mayor a $0.00"
        />
      </View>
    );
  },
};
