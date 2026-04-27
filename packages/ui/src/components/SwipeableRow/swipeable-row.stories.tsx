/**
 * Storybook catalog for the `<SwipeableRow>` primitive.
 *
 * Storybook runs against the **web variant** (`./swipeable-row.web.tsx`),
 * which is a passthrough — desktop's affordance is a right-click
 * context menu, out of scope for this primitive. The stories exist
 * primarily to:
 *
 *   1. Document the `<SwipeableRow>` prop surface and the action-panel
 *      contract (yellow Edit, red Delete) so future contributors see
 *      the brand intent.
 *   2. Provide a Playwright visual baseline for the row's wrapping
 *      DOM (per ADR-017), so a future refactor that loses the
 *      `testID` / `aria-label` plumbing fails the visual gate.
 *   3. Catalog the action-panel ReactNode shape independently so
 *      designers + reviewers can preview the Edit + Delete affordances
 *      without needing a mobile sim.
 *
 * The native swipe gesture itself is verified via Maestro (mobile E2E),
 * matching the Scanner.native pattern (also gesture / camera bound).
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text, View } from '@tamagui/core';
import { colors, typography } from '../../theme';
import { Card } from '../Card/index';
import { Icon } from '../Icon/index';
import { SwipeableRow } from './swipeable-row';

function ExampleRow({ concepto, monto }: { concepto: string; monto: string }): React.ReactElement {
  return (
    <Card variant="white" padding="md">
      <View flexDirection="row" justifyContent="space-between" alignItems="center">
        <View flex={1}>
          <Text
            color={colors.black}
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.bold}
            fontSize={14}
          >
            {concepto}
          </Text>
          <Text
            color={colors.gray600}
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.medium}
            fontSize={12}
            marginTop={2}
          >
            Hoy · 10:48
          </Text>
        </View>
        <Text
          color={colors.black}
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.black}
          fontSize={16}
        >
          {monto}
        </Text>
      </View>
    </Card>
  );
}

/**
 * Mock action-panel preview for designers — renders the same panel
 * the .native variant wraps behind the row, but inline so it's
 * visible in the catalog without a swipe gesture.
 */
function ActionPanelPreview({
  background,
  textColor,
  icon,
  label,
  side,
}: {
  background: string;
  textColor: string;
  icon: 'pencil' | 'trash-2';
  label: string;
  side: 'left' | 'right';
}): React.ReactElement {
  return (
    <View
      width={80}
      height={64}
      backgroundColor={background}
      borderColor={colors.black}
      borderWidth={2}
      borderLeftWidth={side === 'right' ? 2 : 0}
      borderRightWidth={side === 'left' ? 2 : 0}
      alignItems="center"
      justifyContent="center"
      gap={4}
    >
      <Icon name={icon} size={20} color={textColor} />
      <Text
        color={textColor}
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={11}
        letterSpacing={typography.letterSpacing.wide}
        style={{ textTransform: 'uppercase' }}
      >
        {label}
      </Text>
    </View>
  );
}

const meta: Meta<typeof SwipeableRow> = {
  title: 'Phase 1B / Layout / SwipeableRow',
  component: SwipeableRow,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof SwipeableRow>;

/**
 * Web baseline — the wrapper renders children verbatim. On mobile,
 * the same component would expose left-swipe Edit + right-swipe Delete.
 */
export const WebPassthrough: Story = {
  render: () => (
    <View width={420} padding={16} backgroundColor={colors.offwhite}>
      <SwipeableRow
        onSwipeLeft={() => undefined}
        onSwipeRight={() => undefined}
        ariaLabel="Desliza para editar o eliminar"
      >
        <ExampleRow concepto="Pan dulce · Caja 12" monto="$1,200.00" />
      </SwipeableRow>
    </View>
  ),
};

/**
 * Edit panel preview — the yellow brand-faithful affordance the
 * .native variant wraps behind the row when a user swipes
 * left-to-right. Rendered inline here for designer review.
 */
export const EditActionPanelPreview: Story = {
  render: () => (
    <View flexDirection="row" alignItems="stretch" width={420} padding={16}>
      <ActionPanelPreview
        background={colors.yellow}
        textColor={colors.black}
        icon="pencil"
        label="Editar"
        side="left"
      />
      <View flex={1}>
        <ExampleRow concepto="Pan dulce · Caja 12" monto="$1,200.00" />
      </View>
    </View>
  ),
};

/**
 * Delete panel preview — the red brand-faithful affordance the
 * .native variant wraps behind the row when a user swipes
 * right-to-left. The Delete action must always be paired with a
 * `<ConfirmDialog>` confirm step (audit 3.6) — not modelled here.
 */
export const DeleteActionPanelPreview: Story = {
  render: () => (
    <View flexDirection="row" alignItems="stretch" width={420} padding={16}>
      <View flex={1}>
        <ExampleRow concepto="Pan dulce · Caja 12" monto="$1,200.00" />
      </View>
      <ActionPanelPreview
        background={colors.red}
        textColor={colors.white}
        icon="trash-2"
        label="Borrar"
        side="right"
      />
    </View>
  ),
};
