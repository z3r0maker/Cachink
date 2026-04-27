/**
 * Storybook catalog for `<IntegerField>` + `<RhfIntegerField>`.
 *
 * Strips non-digits at the input layer and clamps to optional
 * `min`/`max` bounds on blur. Used for inventory cantidad, días
 * promedio, employee count. Audit Round 2 G2.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { View } from '@tamagui/core';
import { Btn } from '../Btn/index';
import { IntegerField } from './integer-field';
import { RhfIntegerField } from './controlled';

const meta: Meta<typeof IntegerField> = {
  title: 'Phase 1A / Fields / IntegerField',
  component: IntegerField,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof IntegerField>;

/** Plain controlled — no bounds. */
export const Unbounded: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <View padding={16} width={360}>
        <IntegerField label="Cantidad" value={value} onChange={setValue} placeholder="0" />
      </View>
    );
  },
};

/** Bounded — `min={1}` `max={999}` for an inventory quantity. */
export const Bounded: Story = {
  render: () => {
    const [value, setValue] = useState('5');
    return (
      <View padding={16} width={360}>
        <IntegerField
          label="Unidades"
          value={value}
          onChange={setValue}
          min={1}
          max={999}
          note="Entre 1 y 999."
        />
      </View>
    );
  },
};

interface ProductoForm {
  readonly umbral: string;
}

/** RHF wrapper — for forms wired to react-hook-form + Zod. */
export const RhfControlled: Story = {
  render: () => {
    const { control, handleSubmit } = useForm<ProductoForm>({
      defaultValues: { umbral: '3' },
    });
    return (
      <View padding={16} width={360} gap={12}>
        <RhfIntegerField
          control={control}
          name="umbral"
          label="Umbral de stock bajo"
          min={0}
          max={999}
        />
        <Btn onPress={handleSubmit(() => {})}>GUARDAR</Btn>
      </View>
    );
  },
};
