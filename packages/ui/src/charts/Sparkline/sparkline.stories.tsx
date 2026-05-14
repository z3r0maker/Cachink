/**
 * Storybook stories for Sparkline.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { View } from '@tamagui/core';
import { Sparkline } from './sparkline';
import { colors } from '../../theme';

const meta: Meta<typeof Sparkline> = {
  title: 'Charts/Sparkline',
  component: Sparkline,
};

export default meta;
type Story = StoryObj<typeof Sparkline>;

export const UpwardTrend: Story = {
  args: {
    points: [20, 25, 28, 35, 40, 48],
    color: colors.green,
  },
};

export const DownwardTrend: Story = {
  args: {
    points: [50, 45, 38, 30, 25, 18],
    color: colors.red,
  },
};

export const Volatile: Story = {
  args: {
    points: [30, 50, 20, 55, 15, 45],
    color: colors.blue,
  },
};

export const Flat: Story = {
  args: {
    points: [30, 30, 30, 30, 30, 30],
    color: colors.gray400,
  },
};

export const AllTones: Story = {
  render: () => (
    <View flexDirection="row" gap={16}>
      <Sparkline points={[20, 30, 40, 50, 60, 70]} color={colors.green} />
      <Sparkline points={[70, 60, 50, 40, 30, 20]} color={colors.red} />
      <Sparkline points={[30, 50, 20, 55, 15, 45]} color={colors.blue} />
    </View>
  ),
};
