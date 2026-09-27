/**
 * Storybook catalog for `<MoneyField>`.
 *
 * Money inputs are the highest-stakes form primitive in the app
 * (CLAUDE.md §2 principle 8: money is never a float). The stories
 * below demo the controlled string variant.
 * Audit Round 2 G2.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { View } from '@tamagui/core';
import { MoneyField } from './money-field';

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
