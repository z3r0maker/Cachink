/**
 * Storybook catalog for the `<TopBar>` primitive.
 *
 * Stories use real es-MX Cachink copy drawn from CLAUDE.md §1 and the
 * Director Home / Operativo screen specs in P1C. Slots are filled with
 * `<Btn>` and `<Tag>` to demonstrate the canonical patterns: back arrow on
 * the left, role/sync chips, settings cog on the right.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text, View } from '@tamagui/core';
import { Btn } from '../Btn/btn';
import { Tag } from '../Tag/tag';
import { TopBar } from './top-bar';

const noop = (): void => {
  /* story-only handler */
};

const meta: Meta<typeof TopBar> = {
  title: 'Phase 1A / Primitives / Top Bar',
  component: TopBar,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof TopBar>;

/** Canonical minimal shape — title only, no slots, no subtitle. */
export const Default: Story = {
  render: () => (
    <View width={420}>
      <TopBar title="Ventas" />
    </View>
  ),
};

/** Title + subtitle — Estados Financieros pattern. */
export const WithSubtitle: Story = {
  render: () => (
    <View width={420}>
      <TopBar title="Estados Financieros" subtitle="abril 2026" />
    </View>
  ),
};

/** Operativo screen header — role tag on left, sync chip on right. */
export const OperativoScreen: Story = {
  render: () => (
    <View width={520}>
      <TopBar
        title="Ventas"
        left={<Tag variant="brand">Operativo</Tag>}
        right={<Tag variant="soft">Solo este dispositivo</Tag>}
      />
    </View>
  ),
};

/** Director Home — greeting on left, settings cog on right, no title. */
export const DirectorHome: Story = {
  render: () => (
    <View width={520}>
      <TopBar
        left={
          <Text fontWeight={700} fontSize={16}>
            Hola, Mariana
          </Text>
        }
        right={<Text fontSize={20}>⚙</Text>}
      />
    </View>
  ),
};

/** Modal-like header — back button on the left, screen title centered. */
export const BackButton: Story = {
  render: () => (
    <View width={520}>
      <TopBar
        title="Nueva Venta"
        left={
          <Btn variant="ghost" size="sm" onPress={noop}>
            ← VOLVER
          </Btn>
        }
      />
    </View>
  ),
};
