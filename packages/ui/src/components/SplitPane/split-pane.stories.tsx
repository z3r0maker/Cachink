/**
 * Storybook catalog for the `<SplitPane>` primitive.
 *
 * Demonstrates the two-pane layout at three viewport widths:
 *   - 360 px  → stacked (phone fallback)
 *   - 800 px  → side-by-side, default 40/60 split
 *   - 1280 px → side-by-side, custom 30/70 split
 *
 * The catalog hosts list-pane / detail-pane mock content drawn from
 * the Phase 1 Ventas screen so the side-by-side reads as a real
 * tablet-landscape layout, not a synthetic colour-block demo.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text, View } from '@tamagui/core';
import { colors, typography } from '../../theme';
import { Card } from '../Card/index';
import { SectionTitle } from '../SectionTitle/index';
import { SplitPane } from './split-pane';

function ListPane(): React.ReactElement {
  return (
    <View gap={12}>
      <SectionTitle title="Ventas de hoy" />
      {[
        { id: '1', concepto: 'Pan dulce · Caja 12', monto: '$1,200.00' },
        { id: '2', concepto: 'Café molido 250g', monto: '$320.00' },
        { id: '3', concepto: 'Mantequilla 500g', monto: '$140.00' },
      ].map((row) => (
        <Card key={row.id} variant="white" padding="md">
          <Text
            color={colors.black}
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.bold}
            fontSize={14}
          >
            {row.concepto}
          </Text>
          <Text
            color={colors.gray600}
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.medium}
            fontSize={13}
            marginTop={4}
          >
            {row.monto}
          </Text>
        </Card>
      ))}
    </View>
  );
}

function DetailPane(): React.ReactElement {
  return (
    <View gap={12}>
      <SectionTitle title="Detalle" />
      <Card variant="yellow" padding="lg">
        <Text
          color={colors.black}
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.black}
          fontSize={20}
        >
          Pan dulce · Caja 12
        </Text>
        <Text
          color={colors.ink}
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.medium}
          fontSize={13}
          marginTop={8}
        >
          Vendido el 26 abr 2026 · Método: Efectivo · $1,200.00 MXN
        </Text>
      </Card>
    </View>
  );
}

const meta: Meta<typeof SplitPane> = {
  title: 'Phase 1B / Layout / SplitPane',
  component: SplitPane,
  tags: ['autodocs'],
  argTypes: {
    leftFlex: { control: { type: 'number', min: 0.1, max: 0.9, step: 0.05 } },
    rightFlex: { control: { type: 'number', min: 0.1, max: 0.9, step: 0.05 } },
    gap: { control: { type: 'number', min: 0, max: 48, step: 2 } },
  },
  args: { leftFlex: 0.4, rightFlex: 0.6, gap: 16 },
};
export default meta;

type Story = StoryObj<typeof SplitPane>;

/** Default 40/60 split — the canonical list-detail proportions. */
export const Default40To60: Story = {
  render: (args) => (
    <View width={1024} height={420} padding={16} backgroundColor={colors.offwhite}>
      <SplitPane {...args} left={<ListPane />} right={<DetailPane />} />
    </View>
  ),
};

/** Custom 30/70 split — used when the detail pane needs more breathing room. */
export const Custom30To70: Story = {
  render: () => (
    <View width={1024} height={420} padding={16} backgroundColor={colors.offwhite}>
      <SplitPane leftFlex={0.3} rightFlex={0.7} left={<ListPane />} right={<DetailPane />} />
    </View>
  ),
};

/**
 * Phone fallback — at the 360-px viewport the panes stack vertically.
 * Storybook viewport tooling lets the reviewer flip between phone /
 * tablet / desktop to confirm the responsive behaviour.
 */
export const PhoneFallback: Story = {
  render: () => (
    <View width={360} height={720} padding={16} backgroundColor={colors.offwhite}>
      <SplitPane left={<ListPane />} right={<DetailPane />} />
    </View>
  ),
};
