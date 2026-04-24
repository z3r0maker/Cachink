/**
 * Storybook catalog for the `<Input>` primitive.
 *
 * Each story uses real es-MX copy so the catalog doubles as a UX reference
 * for designers. The five stories cover the full type matrix from the mock
 * (`text` / `number` / `date` / `select`) plus the canonical
 * label-with-note surface that anchors a typical form field.
 */
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { View } from '@tamagui/core';
import { Input, type InputProps } from './input';

const meta: Meta<typeof Input> = {
  title: 'Phase 1A / Primitives / Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'number', 'date', 'select'],
    },
    label: { control: 'text' },
    placeholder: { control: 'text' },
    note: { control: 'text' },
    options: { control: 'object' },
  },
  args: { value: '', placeholder: 'ej. Playera estampada' },
  render: (args: InputProps) => <ControlledInput {...args} />,
};
export default meta;

type Story = StoryObj<typeof Input>;

/**
 * Internal helper that wires Storybook args into a real controlled state.
 * Lets the user type/select inside the story canvas exactly like in-app.
 */
function ControlledInput(props: InputProps): ReturnType<typeof Input> {
  const [value, setValue] = useState<string>(props.value);
  return (
    <View padding={16} width={320}>
      <Input {...props} value={value} onChange={setValue} />
    </View>
  );
}

export const Text: Story = {};

export const Number: Story = {
  args: { type: 'number', placeholder: '0.00' },
};

export const Date: Story = {
  args: { type: 'date' },
};

export const Select: Story = {
  args: {
    options: ['Producto', 'Servicio', 'Anticipo', 'Suscripción', 'Otro'],
  },
};

/** The canonical form-field surface a designer reviews. */
export const WithLabelAndNote: Story = {
  args: {
    label: 'Concepto',
    placeholder: '¿Qué vendiste?',
    note: 'Aparece en el comprobante.',
  },
};
