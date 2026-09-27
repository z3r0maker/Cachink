/**
 * Storybook catalog for `<TextField>`, a controlled `useState` primitive.
 * Audit Round 2 G2.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { View } from '@tamagui/core';
import { TextField } from './text-field';

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
