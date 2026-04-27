/**
 * Storybook catalog for the `<Skeleton>` primitive.
 *
 * Compound primitive — `<Skeleton.Row>` for canonical list-row
 * placeholders, `<Skeleton.Bar>` for finer-grained shimmer (KPI strips,
 * header titles). Audit Round 2 G1 added `role="status"` + `aria-busy`
 * + i18n aria-label to the row variant; the catalog below renders
 * both surfaces. Audit Round 2 G2 — closes the Storybook coverage gap.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { View } from '@tamagui/core';
import { Skeleton } from './skeleton';

const meta: Meta<typeof Skeleton.Row> = {
  title: 'Phase 1A / Primitives / Skeleton',
  component: Skeleton.Row,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Skeleton.Row>;

/** Single row — the canonical list-row placeholder. */
export const SingleRow: Story = {
  render: () => (
    <View padding={16} width={360}>
      <Skeleton.Row index={0} testIDPrefix="ventas-skeleton" />
    </View>
  ),
};

/** Three stacked rows — what every list screen mounts on first paint. */
export const ThreeRows: Story = {
  render: () => (
    <View padding={16} width={360} gap={8}>
      <Skeleton.Row index={0} testIDPrefix="ventas-skeleton" />
      <Skeleton.Row index={1} testIDPrefix="ventas-skeleton" />
      <Skeleton.Row index={2} testIDPrefix="ventas-skeleton" />
    </View>
  ),
};

/** Standalone bars — for KPI strip / header title shimmer. */
export const Bars: Story = {
  render: () => (
    <View padding={16} width={360} gap={12}>
      <Skeleton.Bar height={28} width="60%" testID="kpi-shimmer" />
      <Skeleton.Bar height={16} width="100%" testID="row-shimmer" />
      <Skeleton.Bar height={16} width="40%" testID="hint-shimmer" />
    </View>
  ),
};
