/**
 * Storybook catalog for the `<BottomTabBar>` primitive.
 *
 * Stories use real es-MX Cachink tab labels drawn from CLAUDE.md §1
 * (Operativo: 3 tabs / Director: 6 tabs). Icons are emoji placeholders —
 * the real icon library decision lands in Phase 1C.
 */
import type { ReactElement } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text, View } from '@tamagui/core';
import { BottomTabBar } from './bottom-tab-bar';

const noop = (): void => {
  /* story-only: tap handler */
};

function Glyph({ char }: { char: string }): ReactElement {
  return <Text fontSize={20}>{char}</Text>;
}

const meta: Meta<typeof BottomTabBar> = {
  title: 'Phase 1A / Primitives / Bottom Tab Bar',
  component: BottomTabBar,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof BottomTabBar>;

/** Operativo — 3 tabs, "ventas" active. */
export const Operativo: Story = {
  render: () => (
    <View width={420}>
      <BottomTabBar
        activeKey="ventas"
        items={[
          { key: 'ventas', label: 'Ventas', icon: <Glyph char="💰" />, onPress: noop },
          { key: 'egresos', label: 'Egresos', icon: <Glyph char="📤" />, onPress: noop },
          { key: 'inventario', label: 'Inventario', icon: <Glyph char="📦" />, onPress: noop },
        ]}
      />
    </View>
  ),
};

/** Director — 6 tabs, "home" active. */
export const Director: Story = {
  render: () => (
    <View width={720}>
      <BottomTabBar
        activeKey="home"
        items={[
          { key: 'home', label: 'Home', icon: <Glyph char="🏠" />, onPress: noop },
          { key: 'ventas', label: 'Ventas', icon: <Glyph char="💰" />, onPress: noop },
          { key: 'egresos', label: 'Egresos', icon: <Glyph char="📤" />, onPress: noop },
          { key: 'inventario', label: 'Inventario', icon: <Glyph char="📦" />, onPress: noop },
          { key: 'estados', label: 'Estados', icon: <Glyph char="📊" />, onPress: noop },
          { key: 'indicadores', label: 'Indicadores', icon: <Glyph char="📈" />, onPress: noop },
        ]}
      />
    </View>
  ),
};

/** Director with badges — Egresos has 3 pendientes, Inventario has 1 stock-bajo. */
export const WithBadges: Story = {
  render: () => (
    <View width={720}>
      <BottomTabBar
        activeKey="home"
        items={[
          { key: 'home', label: 'Home', icon: <Glyph char="🏠" />, onPress: noop },
          { key: 'ventas', label: 'Ventas', icon: <Glyph char="💰" />, onPress: noop },
          { key: 'egresos', label: 'Egresos', icon: <Glyph char="📤" />, onPress: noop, badge: 3 },
          { key: 'inventario', label: 'Inventario', icon: <Glyph char="📦" />, onPress: noop, badge: 1 },
          { key: 'estados', label: 'Estados', icon: <Glyph char="📊" />, onPress: noop },
          { key: 'indicadores', label: 'Indicadores', icon: <Glyph char="📈" />, onPress: noop },
        ]}
      />
    </View>
  ),
};

/** Iconless fallback — verifies layout still works without icons. */
export const IconlessFallback: Story = {
  render: () => (
    <View width={420}>
      <BottomTabBar
        activeKey="ventas"
        items={[
          { key: 'ventas', label: 'Ventas', onPress: noop },
          { key: 'egresos', label: 'Egresos', onPress: noop },
          { key: 'inventario', label: 'Inventario', onPress: noop },
        ]}
      />
    </View>
  ),
};

/** Mid-position active — catches positional CSS bugs on the middle tab. */
export const MidSelection: Story = {
  render: () => (
    <View width={720}>
      <BottomTabBar
        activeKey="inventario"
        items={[
          { key: 'home', label: 'Home', icon: <Glyph char="🏠" />, onPress: noop },
          { key: 'ventas', label: 'Ventas', icon: <Glyph char="💰" />, onPress: noop },
          { key: 'egresos', label: 'Egresos', icon: <Glyph char="📤" />, onPress: noop },
          { key: 'inventario', label: 'Inventario', icon: <Glyph char="📦" />, onPress: noop },
          { key: 'estados', label: 'Estados', icon: <Glyph char="📊" />, onPress: noop },
          { key: 'indicadores', label: 'Indicadores', icon: <Glyph char="📈" />, onPress: noop },
        ]}
      />
    </View>
  ),
};
