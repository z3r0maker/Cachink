/**
 * Storybook catalog for the `<Gauge>` primitive.
 *
 * Each story wraps the Gauge in a white `<Card padding="lg">` so the
 * catalog mirrors real Phase 1C usage on the Indicadores screen. Examples
 * intentionally exercise different `max` values + custom formatters so the
 * "× ratio", "meses", and "días" units all get rendered.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { View } from '@tamagui/core';
import { Card } from '../Card/card';
import { Gauge } from './gauge';

const meta: Meta<typeof Gauge> = {
  title: 'Phase 1A / Primitives / Gauge',
  component: Gauge,
  tags: ['autodocs'],
  argTypes: {
    tone: {
      control: 'select',
      options: ['neutral', 'positive', 'warning', 'negative'],
    },
    showValue: { control: 'boolean' },
  },
  args: { value: 62, max: 100, label: 'Margen bruto', tone: 'positive' },
};
export default meta;

type Story = StoryObj<typeof Gauge>;

/** Canonical percentage gauge — positive tone, default formatter → "62%". */
export const MargenBruto: Story = {
  render: () => (
    <View padding={16} width={320}>
      <Card padding="lg">
        <Gauge label="Margen bruto" value={62} tone="positive" />
      </Card>
    </View>
  ),
};

/** Ratio gauge — custom formatter → "1.3×", warning tone. */
export const Liquidez: Story = {
  render: () => (
    <View padding={16} width={320}>
      <Card padding="lg">
        <Gauge
          label="Razón de liquidez"
          value={1.3}
          max={2}
          tone="warning"
          valueFormatter={(v) => `${v.toFixed(1)}×`}
        />
      </Card>
    </View>
  ),
};

/** Custom unit gauge — neutral tone, "4 meses" formatter. */
export const RotacionInventario: Story = {
  render: () => (
    <View padding={16} width={320}>
      <Card padding="lg">
        <Gauge
          label="Rotación de inventario"
          value={4}
          max={12}
          tone="neutral"
          valueFormatter={(v) => `${v} meses`}
        />
      </Card>
    </View>
  ),
};

/** Alert tone — negative red fill for a critical metric. */
export const Alerta: Story = {
  render: () => (
    <View padding={16} width={320}>
      <Card padding="lg">
        <Gauge
          label="Días de caja"
          value={7}
          max={30}
          tone="negative"
          valueFormatter={(v) => `${v} días`}
        />
      </Card>
    </View>
  ),
};

/** All four tones rendered side-by-side for visual-parity review. */
export const AllTones: Story = {
  render: () => (
    <View flexDirection="column" gap={16} padding={16} width={320}>
      <Card padding="lg">
        <Gauge label="Neutral" value={50} tone="neutral" />
      </Card>
      <Card padding="lg">
        <Gauge label="Positive" value={75} tone="positive" />
      </Card>
      <Card padding="lg">
        <Gauge label="Warning" value={40} tone="warning" />
      </Card>
      <Card padding="lg">
        <Gauge label="Negative" value={20} tone="negative" />
      </Card>
    </View>
  ),
};
