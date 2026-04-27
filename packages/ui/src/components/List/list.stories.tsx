/**
 * Storybook catalog for the `<List>` primitive.
 *
 * The web variant renders a straight `.map()` inside a `<View>`; the
 * native variant delegates to `<FlatList>`. Storybook resolves the
 * web variant via Vite — the visual contract is identical to a
 * production list mount on desktop / Tauri. Audit Round 2 G2.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text, View } from '@tamagui/core';
import { Card } from '../Card/index';
import { EmptyState } from '../EmptyState/index';
import { SectionTitle } from '../SectionTitle/index';
import { List } from './list';

interface Venta {
  readonly id: string;
  readonly concepto: string;
  readonly monto: string;
}

const ventas: readonly Venta[] = [
  { id: 'v-1', concepto: 'Café americano', monto: '$45.00' },
  { id: 'v-2', concepto: 'Pan dulce', monto: '$22.00' },
  { id: 'v-3', concepto: 'Combo desayuno', monto: '$120.00' },
  { id: 'v-4', concepto: 'Latte vainilla', monto: '$58.00' },
  { id: 'v-5', concepto: 'Sandwich pavo', monto: '$95.00' },
];

const renderRow = (item: Venta): React.ReactNode => (
  <Card padding="md" fullWidth>
    <View flexDirection="row" justifyContent="space-between">
      <Text>{item.concepto}</Text>
      <Text>{item.monto}</Text>
    </View>
  </Card>
);

const meta: Meta<typeof List<Venta>> = {
  title: 'Phase 1A / Primitives / List',
  component: List<Venta>,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof List<Venta>>;

/** Five-row Ventas list — happy path. */
export const Ventas: Story = {
  render: () => (
    <View padding={16} width={360} gap={8}>
      <List data={ventas} renderItem={renderRow} keyExtractor={(v) => v.id} />
    </View>
  ),
};

/** Header + footer slots wrapping the row collection. */
export const WithHeaderFooter: Story = {
  render: () => (
    <View padding={16} width={360} gap={8}>
      <List
        data={ventas}
        renderItem={renderRow}
        keyExtractor={(v) => v.id}
        ListHeaderComponent={<SectionTitle title="Ventas hoy · 5" />}
        ListFooterComponent={
          <Text fontSize={12} color="#5A5A56" marginTop={8}>
            Mostrando 5 de 5
          </Text>
        }
      />
    </View>
  ),
};

/** Empty state — `ListEmptyComponent` slot rendered when `data` is empty. */
export const Empty: Story = {
  render: () => (
    <View padding={16} width={360} gap={8}>
      <List
        data={[] as readonly Venta[]}
        renderItem={renderRow}
        keyExtractor={(v) => v.id}
        ListEmptyComponent={
          <EmptyState
            emoji="📭"
            title="Sin ventas todavía"
            description="Registra tu primera venta del día."
          />
        }
      />
    </View>
  ),
};
