/**
 * Storybook stories for DivergingBar.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { DivergingBar } from './diverging-bar';

const meta: Meta<typeof DivergingBar> = {
  title: 'Charts/DivergingBar',
  component: DivergingBar,
};

export default meta;
type Story = StoryObj<typeof DivergingBar>;

export const FlujoDeEfectivo: Story = {
  args: {
    items: [
      { label: 'Operación', value: 25000 },
      { label: 'Inversión', value: -8000 },
    ],
  },
};

export const BothPositive: Story = {
  args: {
    items: [
      { label: 'Operación', value: 30000 },
      { label: 'Inversión', value: 5000 },
    ],
  },
};

export const BothNegative: Story = {
  args: {
    items: [
      { label: 'Operación', value: -10000 },
      { label: 'Inversión', value: -15000 },
    ],
  },
};
