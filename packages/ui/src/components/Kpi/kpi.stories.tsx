/**
 * Storybook catalog for the `<Kpi>` primitive.
 *
 * Each story wraps the Kpi in a white `<Card padding="lg">` so the catalog
 * mirrors real Phase 1C usage on the Director Home / Indicadores screens.
 * Values are hardcoded "$1,234.56" strings; once `formatMoney(...)` lands
 * (P1A-M3-T03) consumers will pipe centavos through it. Pre-formatting in
 * the story file keeps the Kpi primitive itself agnostic of domain types.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { View } from '@tamagui/core';
import { Card } from '../Card/card';
import { Kpi } from './kpi';

const meta: Meta<typeof Kpi> = {
  title: 'Phase 1A / Primitives / Kpi',
  component: Kpi,
  tags: ['autodocs'],
  argTypes: {
    tone: { control: 'select', options: ['neutral', 'positive', 'negative'] },
  },
  args: { label: 'Ventas hoy', value: '$8,450.00', tone: 'neutral' },
};
export default meta;

type Story = StoryObj<typeof Kpi>;

/** Canonical Director Home shape — neutral tone with comparison hint. */
export const VentasHoy: Story = {
  render: () => (
    <View padding={16} width={320}>
      <Card padding="lg">
        <Kpi label="Ventas hoy" value="$8,450.00" hint="vs. ayer +12%" />
      </Card>
    </View>
  ),
};

/** Hero metric — positive tone, no hint. */
export const UtilidadMes: Story = {
  render: () => (
    <View padding={16} width={320}>
      <Card padding="lg">
        <Kpi label="Utilidad del mes" value="$24,180.00" tone="positive" />
      </Card>
    </View>
  ),
};

/** Negative tone — egresos exceeding the daily reference. */
export const EgresosHoy: Story = {
  render: () => (
    <View padding={16} width={320}>
      <Card padding="lg">
        <Kpi
          label="Egresos hoy"
          value="-$1,340.00"
          hint="vs. ayer +8%"
          tone="negative"
        />
      </Card>
    </View>
  ),
};

/** Count metric — proves Kpi is currency-agnostic (no $ symbol required). */
export const StockTotal: Story = {
  render: () => (
    <View padding={16} width={320}>
      <Card padding="lg">
        <Kpi label="Productos en stock" value="42" />
      </Card>
    </View>
  ),
};

/** All three tones rendered side-by-side for visual-parity review. */
export const AllTones: Story = {
  render: () => (
    <View flexDirection="column" gap={16} padding={16} width={320}>
      <Card padding="lg">
        <Kpi label="Neutral" value="$1,234.56" />
      </Card>
      <Card padding="lg">
        <Kpi label="Positive" value="$1,234.56" tone="positive" />
      </Card>
      <Card padding="lg">
        <Kpi label="Negative" value="-$1,234.56" tone="negative" />
      </Card>
    </View>
  ),
};
