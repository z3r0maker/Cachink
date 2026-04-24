/**
 * Storybook catalog for the `<EmptyState>` primitive.
 *
 * Each story uses real es-MX Cachink copy so the catalog doubles as a UX
 * reference for designers — mirroring the precedent set by Btn / Input /
 * Tag / Modal. The canonical happy-path (VentasVacio) exercises every
 * prop; the remaining four cover alternate real contexts plus two edge
 * cases (no action, minimum props).
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { View } from '@tamagui/core';
import { Btn } from '../Btn/btn';
import { EmptyState } from './empty-state';

const meta: Meta<typeof EmptyState> = {
  title: 'Phase 1A / Primitives / Empty State',
  component: EmptyState,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    emoji: { control: 'text' },
  },
  args: { title: 'Sin ventas todavía', emoji: '📭' },
};
export default meta;

type Story = StoryObj<typeof EmptyState>;

/** Canonical happy-path — every prop present, Ventas context. */
export const VentasVacio: Story = {
  render: () => (
    <View padding={16}>
      <EmptyState
        emoji="📭"
        title="Sin ventas todavía"
        description="Registra tu primera venta del día."
        action={<Btn>+ Nueva Venta</Btn>}
      />
    </View>
  ),
};

/** Egresos list — alternate real context. */
export const EgresosVacio: Story = {
  render: () => (
    <View padding={16}>
      <EmptyState
        emoji="🧾"
        title="Sin egresos registrados"
        description="Un gasto, una nómina o una compra de inventario."
        action={<Btn>+ Nuevo Egreso</Btn>}
      />
    </View>
  ),
};

/** Inventario list — alternate real context. */
export const InventarioVacio: Story = {
  render: () => (
    <View padding={16}>
      <EmptyState
        emoji="📦"
        title="Sin productos"
        description="Agrega tu primer producto para empezar a llevar inventario."
        action={<Btn>+ Nuevo Producto</Btn>}
      />
    </View>
  ),
};

/** Search edge case — no action, just a "try something else" hint. */
export const SinResultados: Story = {
  render: () => (
    <View padding={16}>
      <EmptyState
        emoji="🔎"
        title="Sin resultados"
        description="Intenta con otra búsqueda o limpia el filtro."
      />
    </View>
  ),
};

/** Minimum-props edge case — title only, no emoji, no description, no action. */
export const TituloSolo: Story = {
  render: () => (
    <View padding={16}>
      <EmptyState title="Nada por hoy" />
    </View>
  ),
};
