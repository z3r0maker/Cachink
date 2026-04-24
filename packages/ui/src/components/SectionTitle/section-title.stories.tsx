/**
 * Storybook catalog for the `<SectionTitle>` primitive.
 *
 * Each story uses real es-MX Cachink copy drawn from ROADMAP.md P1C-M10
 * (Director Home) so the catalog doubles as a UX reference. The canonical
 * minimal shape (VentasHoy) is the shortest render; the remaining four
 * exercise alternate real contexts, count-in-title composition, and the
 * two common CTA shapes (ghost "Ver todo" and primary "+ Nuevo").
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { View } from '@tamagui/core';
import { Btn } from '../Btn/btn';
import { SectionTitle } from './section-title';

const meta: Meta<typeof SectionTitle> = {
  title: 'Phase 1A / Primitives / Section Title',
  component: SectionTitle,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
  },
  args: { title: 'Ventas hoy' },
};
export default meta;

type Story = StoryObj<typeof SectionTitle>;

/** Canonical shortest shape — title only, no action. */
export const VentasHoy: Story = {
  render: () => (
    <View padding={16}>
      <SectionTitle title="Ventas hoy" />
    </View>
  ),
};

/** Alternate real context — still the minimal title-only shape. */
export const ActividadReciente: Story = {
  render: () => (
    <View padding={16}>
      <SectionTitle title="Actividad reciente" />
    </View>
  ),
};

/**
 * Count-in-title composition. No separate prop for a count today —
 * consumers concatenate directly, keeping the surface at two props.
 */
export const StockBajo: Story = {
  render: () => (
    <View padding={16}>
      <SectionTitle title="Stock bajo · 3" />
    </View>
  ),
};

/** Canonical Director Home pattern — title + ghost "Ver todo" CTA. */
export const CuentasPorCobrar: Story = {
  render: () => (
    <View padding={16}>
      <SectionTitle
        title="Cuentas por cobrar"
        action={
          <Btn variant="ghost" size="sm">
            Ver todo
          </Btn>
        }
      />
    </View>
  ),
};

/** Inventario header shape — title + primary "+ Nuevo" CTA. */
export const Productos: Story = {
  render: () => (
    <View padding={16}>
      <SectionTitle title="Productos" action={<Btn size="sm">+ Nuevo</Btn>} />
    </View>
  ),
};
