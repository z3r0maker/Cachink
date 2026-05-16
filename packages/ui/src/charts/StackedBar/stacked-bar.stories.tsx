/**
 * Storybook stories for StackedBar.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { StackedBar } from './stacked-bar';
import { colors } from '../../theme';

const meta: Meta<typeof StackedBar> = {
  title: 'Charts/StackedBar',
  component: StackedBar,
};

export default meta;
type Story = StoryObj<typeof StackedBar>;

export const ActivoComposition: Story = {
  args: {
    segments: [
      { label: 'Efectivo', value: 50000, color: colors.green },
      { label: 'Inventarios', value: 30000, color: colors.blue },
      { label: 'CxC', value: 20000, color: colors.warning },
    ],
  },
};

export const TwoSegments: Story = {
  args: {
    segments: [
      { label: 'A', value: 50, color: colors.green },
      { label: 'B', value: 50, color: colors.blue },
    ],
  },
};

export const DominantSegment: Story = {
  args: {
    segments: [
      { label: 'Big', value: 950, color: colors.green },
      { label: 'Small', value: 50, color: colors.red },
    ],
  },
};
