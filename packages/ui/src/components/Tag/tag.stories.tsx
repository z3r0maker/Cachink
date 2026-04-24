/**
 * Storybook catalog for the `<Tag>` primitive.
 *
 * Uses real es-MX copy drawn from the mock's enumerations
 * (`VENTAS_CAT` / `METODOS` / `EGRESO_CAT`) so the catalog doubles as
 * a UX reference for designers. The four focused stories cover the
 * most-used variants in the mock; the fifth renders all seven variants
 * side-by-side for visual review.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { View } from '@tamagui/core';
import { Tag } from './tag';

const meta: Meta<typeof Tag> = {
  title: 'Phase 1A / Primitives / Tag',
  component: Tag,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['neutral', 'brand', 'soft', 'success', 'info', 'danger', 'warning'],
    },
  },
  args: { children: 'Producto', variant: 'neutral' },
};
export default meta;

type Story = StoryObj<typeof Tag>;

/** Primary categoria chip — the most common mock usage. */
export const Soft: Story = {
  args: { variant: 'soft', children: 'Producto' },
};

/** Venta `metodo` pill — Efectivo on a VentaCard. */
export const Success: Story = {
  args: { variant: 'success', children: 'Efectivo' },
};

/** Default egreso categoria pill — renta / servicios. */
export const Danger: Story = {
  args: { variant: 'danger', children: 'Renta' },
};

/** Nómina egreso categoria pill. */
export const Info: Story = {
  args: { variant: 'info', children: 'Nómina' },
};

/** All 7 variants in a vertical stack — designer visual-review surface. */
export const AllVariants: Story = {
  render: () => (
    <View flexDirection="column" gap={8} padding={12} alignItems="flex-start">
      <Tag variant="neutral">Neutral</Tag>
      <Tag variant="brand">Nuevo</Tag>
      <Tag variant="soft">Producto</Tag>
      <Tag variant="success">Efectivo</Tag>
      <Tag variant="info">Nómina</Tag>
      <Tag variant="danger">Renta</Tag>
      <Tag variant="warning">Precaución</Tag>
    </View>
  ),
};
