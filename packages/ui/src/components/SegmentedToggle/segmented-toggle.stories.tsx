import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { View } from '@tamagui/core';
import { SegmentedToggle } from './segmented-toggle';

type Metodo = 'efectivo' | 'transfer' | 'tarjeta';

const meta: Meta<typeof SegmentedToggle<Metodo>> = {
  title: 'Phase 1A / Primitives / SegmentedToggle',
  component: SegmentedToggle<Metodo>,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof SegmentedToggle<Metodo>>;

const OPTIONS = [
  { key: 'efectivo' as const, label: 'Efectivo' },
  { key: 'transfer' as const, label: 'Transfer.' },
  { key: 'tarjeta' as const, label: 'Tarjeta' },
];

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<Metodo>('efectivo');
    return (
      <View padding={20} width={360}>
        <SegmentedToggle<Metodo>
          label="Método de pago"
          value={value}
          options={OPTIONS}
          onChange={setValue}
        />
      </View>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <View padding={20} width={360}>
      <SegmentedToggle<Metodo>
        label="Método de pago"
        value="efectivo"
        options={OPTIONS}
        onChange={() => null}
        disabled
      />
    </View>
  ),
};

export const TwoOptions: Story = {
  render: () => {
    type Range = 'mensual' | 'anual';
    const [value, setValue] = useState<Range>('mensual');
    return (
      <View padding={20} width={280}>
        <SegmentedToggle<Range>
          label="Periodo"
          value={value}
          options={[
            { key: 'mensual', label: 'Mensual' },
            { key: 'anual', label: 'Anual' },
          ]}
          onChange={setValue}
        />
      </View>
    );
  },
};
