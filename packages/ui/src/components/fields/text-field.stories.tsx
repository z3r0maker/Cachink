/**
 * Storybook catalog for `<TextField>` + `<RhfTextField>`.
 *
 * The plain field is a controlled `useState` primitive. The RHF
 * wrapper takes a `control` + `name` and renders a `<Controller>`
 * internally so call sites collapse a form row to one component.
 * Audit Round 2 G2.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { View } from '@tamagui/core';
import { Btn } from '../Btn/index';
import { TextField } from './text-field';
import { RhfTextField } from './controlled';

const meta: Meta<typeof TextField> = {
  title: 'Phase 1A / Fields / TextField',
  component: TextField,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof TextField>;

/** Plain controlled `useState` form row — the simplest call site. */
export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <View padding={16} width={360}>
        <TextField
          label="Nombre del cliente"
          value={value}
          onChange={setValue}
          placeholder="Ej. María González"
        />
      </View>
    );
  },
};

interface ClienteForm {
  readonly nombre: string;
}

/** RHF + Zod wrapper — `<RhfTextField control={control} name="nombre" />`. */
export const RhfControlled: Story = {
  render: () => {
    const { control, handleSubmit } = useForm<ClienteForm>({
      defaultValues: { nombre: '' },
    });
    return (
      <View padding={16} width={360} gap={12}>
        <RhfTextField
          control={control}
          name="nombre"
          label="Nombre del cliente"
          placeholder="Ej. María González"
        />
        <Btn onPress={handleSubmit(() => {})}>GUARDAR</Btn>
      </View>
    );
  },
};

/** With a note — secondary descriptive copy below the input. */
export const WithNote: Story = {
  render: () => {
    const [value, setValue] = useState('Café americano');
    return (
      <View padding={16} width={360}>
        <TextField
          label="Concepto"
          value={value}
          onChange={setValue}
          note="Aparecerá en el comprobante."
        />
      </View>
    );
  },
};
