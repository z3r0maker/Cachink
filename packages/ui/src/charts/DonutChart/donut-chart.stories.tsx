/**
 * Storybook stories for DonutChart.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { DonutChart } from './donut-chart';
import { CHART_PALETTE } from '../chart-tokens';

const meta: Meta<typeof DonutChart> = {
  title: 'Charts/DonutChart',
  component: DonutChart,
};

export default meta;
type Story = StoryObj<typeof DonutChart>;

export const EgresosPorCategoria: Story = {
  args: {
    slices: [
      { label: 'Materia Prima', value: 15000, color: CHART_PALETTE[0] },
      { label: 'Inventario', value: 8000, color: CHART_PALETTE[1] },
      { label: 'Nómina', value: 12000, color: CHART_PALETTE[2] },
      { label: 'Renta', value: 5000, color: CHART_PALETTE[3] },
      { label: 'Servicios', value: 3000, color: CHART_PALETTE[6] },
      { label: 'Publicidad', value: 2000, color: CHART_PALETTE[4] },
    ],
    centerLabel: 'Total egresos',
    centerValue: '$45,000',
  },
};

export const TwoSlices: Story = {
  args: {
    slices: [
      { label: 'Nómina', value: 20000, color: CHART_PALETTE[2] },
      { label: 'Renta', value: 20000, color: CHART_PALETTE[3] },
    ],
    centerLabel: 'Total',
    centerValue: '$40,000',
  },
};

export const SingleSlice: Story = {
  args: {
    slices: [{ label: 'Nómina', value: 50000, color: CHART_PALETTE[2] }],
    centerLabel: 'Total',
    centerValue: '$50,000',
  },
};

export const WithSmallSlices: Story = {
  args: {
    slices: [
      { label: 'Materia Prima', value: 50000, color: CHART_PALETTE[0] },
      { label: 'Nómina', value: 30000, color: CHART_PALETTE[2] },
      { label: 'Tiny A', value: 500, color: CHART_PALETTE[4] },
      { label: 'Tiny B', value: 300, color: CHART_PALETTE[5] },
      { label: 'Tiny C', value: 200, color: CHART_PALETTE[6] },
    ],
    centerLabel: 'Total',
    centerValue: '$81,000',
  },
};
