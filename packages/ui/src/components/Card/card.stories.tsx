/**
 * Storybook catalog for the `<Card>` primitive.
 *
 * Stories use real es-MX Cachink copy drawn from ROADMAP.md P1C-M10
 * (Director Home) so the catalog doubles as a UX reference. The
 * `all-variants` story renders the three surfaces side-by-side for designer
 * visual-parity review.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text, View } from '@tamagui/core';
import { colors, typography } from '../../theme';
import { Card } from './card';

const meta: Meta<typeof Card> = {
  title: 'Phase 1A / Primitives / Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['white', 'yellow', 'black'] },
    padding: { control: 'select', options: ['none', 'sm', 'md', 'lg'] },
    fullWidth: { control: 'boolean' },
  },
  args: { variant: 'white', padding: 'md' },
};
export default meta;

type Story = StoryObj<typeof Card>;

/** Canonical white surface — the most common Card on every screen. */
export const WhiteDefault: Story = {
  render: () => (
    <View padding={16} width={320}>
      <Card>
        <Text
          color={colors.black}
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.bold}
          fontSize={14}
        >
          Venta registrada · $450.00
        </Text>
      </Card>
    </View>
  ),
};

/** Director Home "Utilidad del mes" hero shape — yellow surface, large pad. */
export const YellowHero: Story = {
  render: () => (
    <View padding={16} width={320}>
      <Card variant="yellow" padding="lg">
        <Text
          color={colors.gray600}
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.bold}
          fontSize={11}
          letterSpacing={typography.letterSpacing.wide}
          style={{ textTransform: 'uppercase' }}
        >
          Utilidad del mes
        </Text>
        <Text
          color={colors.black}
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.black}
          fontSize={36}
          letterSpacing={typography.letterSpacing.tightest}
          marginTop={6}
        >
          $24,180.00
        </Text>
      </Card>
    </View>
  ),
};

/** Director-only highlight — black surface with white-on-black children. */
export const BlackDirector: Story = {
  render: () => (
    <View padding={16} width={320}>
      <Card variant="black" padding="lg">
        <Text
          color={colors.white}
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.bold}
          fontSize={11}
          letterSpacing={typography.letterSpacing.wide}
          style={{ textTransform: 'uppercase' }}
        >
          Saldo en caja
        </Text>
        <Text
          color={colors.yellow}
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.black}
          fontSize={32}
          letterSpacing={typography.letterSpacing.tightest}
          marginTop={6}
        >
          $8,940.00
        </Text>
      </Card>
    </View>
  ),
};

/** Tappable Card — applies the §8.3 press transform. */
export const Tappable: Story = {
  render: () => (
    <View padding={16} width={320}>
      <Card
        onPress={() => {
          // story-only — designer reviews press feel via hover/click
        }}
      >
        <Text
          color={colors.black}
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.bold}
          fontSize={14}
        >
          Toca para abrir el detalle de la venta
        </Text>
      </Card>
    </View>
  ),
};

/** All three variants rendered side-by-side for visual-parity review. */
export const AllVariants: Story = {
  render: () => (
    <View flexDirection="column" gap={16} padding={16} width={320}>
      <Card variant="white">
        <Text
          color={colors.black}
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.bold}
          fontSize={14}
        >
          White surface
        </Text>
      </Card>
      <Card variant="yellow">
        <Text
          color={colors.black}
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.bold}
          fontSize={14}
        >
          Yellow surface
        </Text>
      </Card>
      <Card variant="black">
        <Text
          color={colors.white}
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.bold}
          fontSize={14}
        >
          Black surface
        </Text>
      </Card>
    </View>
  ),
};
