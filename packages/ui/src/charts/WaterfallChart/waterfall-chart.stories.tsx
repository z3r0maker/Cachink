/**
 * Storybook stories for WaterfallChart.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { WaterfallChart } from './waterfall-chart';

const meta: Meta<typeof WaterfallChart> = {
  title: 'Charts/WaterfallChart',
  component: WaterfallChart,
};

export default meta;
type Story = StoryObj<typeof WaterfallChart>;

export const Default: Story = {
  args: {
    data: [
      { label: 'Ingresos', value: 50000, type: 'income' },
      { label: 'Costo', value: 20000, type: 'expense' },
      { label: 'Ut. Bruta', value: 30000, type: 'subtotal' },
      { label: 'Gastos Op.', value: 12000, type: 'expense' },
      { label: 'Ut. Op.', value: 18000, type: 'subtotal' },
      { label: 'ISR', value: 5400, type: 'expense' },
      { label: 'Ut. Neta', value: 12600, type: 'subtotal' },
    ],
  },
};

export const AllPositive: Story = {
  args: {
    data: [
      { label: 'Ingresos', value: 100000, type: 'income' },
      { label: 'Costo', value: 15000, type: 'expense' },
      { label: 'Ut. Bruta', value: 85000, type: 'subtotal' },
      { label: 'Gastos Op.', value: 10000, type: 'expense' },
      { label: 'Ut. Op.', value: 75000, type: 'subtotal' },
      { label: 'ISR', value: 22500, type: 'expense' },
      { label: 'Ut. Neta', value: 52500, type: 'subtotal' },
    ],
  },
};

export const NetLoss: Story = {
  args: {
    data: [
      { label: 'Ingresos', value: 10000, type: 'income' },
      { label: 'Costo', value: 8000, type: 'expense' },
      { label: 'Ut. Bruta', value: 2000, type: 'subtotal' },
      { label: 'Gastos Op.', value: 5000, type: 'expense' },
      { label: 'Ut. Op.', value: -3000, type: 'subtotal' },
      { label: 'ISR', value: 0, type: 'expense' },
      { label: 'Ut. Neta', value: -3000, type: 'subtotal' },
    ],
  },
};

export const AllZeros: Story = {
  args: {
    data: [
      { label: 'Ingresos', value: 0, type: 'income' },
      { label: 'Costo', value: 0, type: 'expense' },
      { label: 'Ut. Bruta', value: 0, type: 'subtotal' },
      { label: 'Gastos Op.', value: 0, type: 'expense' },
      { label: 'Ut. Op.', value: 0, type: 'subtotal' },
      { label: 'ISR', value: 0, type: 'expense' },
      { label: 'Ut. Neta', value: 0, type: 'subtotal' },
    ],
  },
};
