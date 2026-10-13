/**
 * Storybook catalog for the `<FAB>` primitive.
 *
 * The FAB is normally mounted via `position:'absolute'`. Stories
 * render it inside a sized parent View so the snapshot captures the
 * floating geometry without anchoring it to a real screen. Audit
 * Round 2 G2 — closes the Storybook coverage gap for FAB.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { View } from '@tamagui/core';
import { FAB } from './fab';
import { Icon } from '../Icon/index';

const meta: Meta<typeof FAB> = {
  title: 'Phase 1A / Primitives / FAB',
  component: FAB,
  tags: ['autodocs'],
  argTypes: {
    ariaLabel: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  args: {
    ariaLabel: 'Nueva venta',
    icon: <Icon name="plus" size={28} />,
    onPress: () => {},
  },
};
export default meta;

type Story = StoryObj<typeof FAB>;

/** Canonical floating "+ Nueva" — anchored above the BottomTabBar. */
export const Default: Story = {
  render: (args) => (
    <View width={360} height={200} backgroundColor="#F7F7F5">
      <FAB {...args} />
    </View>
  ),
};

/** Disabled state — dimmed, taps rejected. */
export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => (
    <View width={360} height={200} backgroundColor="#F7F7F5">
      <FAB {...args} />
    </View>
  ),
};

/** Custom anchor — a screen with two FABs needs explicit `bottom`. */
export const Stacked: Story = {
  render: () => (
    <View width={360} height={260} backgroundColor="#F7F7F5">
      <FAB
        icon={<Icon name="camera" size={28} />}
        ariaLabel="Escanear código"
        onPress={() => {}}
        bottom={160}
      />
      <FAB icon={<Icon name="plus" size={28} />} ariaLabel="Nueva venta" onPress={() => {}} />
    </View>
  ),
};

/** Pressed — `:active` pseudo forced on for the press transform demo. */
export const Pressed: Story = {
  parameters: { pseudo: { active: true } },
  render: (args) => (
    <View width={360} height={200} backgroundColor="#F7F7F5">
      <FAB {...args} />
    </View>
  ),
};
