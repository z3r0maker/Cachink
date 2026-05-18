/**
 * QuickAmounts — horizontal row of MXN bill quick-tap buttons.
 *
 * Shows the 5 most common MXN denominations ($50, $100, $200, $500,
 * $1000) plus an "Exacto" button for exact-change payments. Tapping
 * a bill sets the numpad amount to that value instantly.
 *
 * Each pill shows a small banknote icon for visual affordance.
 * The "Exacto" pill uses a check icon instead.
 */

import type { ReactElement } from 'react';
import { ScrollView, Pressable, type ViewStyle } from 'react-native';
import { Text, View } from '@tamagui/core';
import { colors, typography } from '../../theme';
import { impactLight } from '../../haptics/index';
import { Icon } from '../Icon/index';

export interface QuickAmountOption {
  /** Label shown on the button, e.g. "$500" */
  readonly label: string;
  /** Amount in centavos */
  readonly centavos: bigint;
}

export const MXN_BILL_AMOUNTS: readonly QuickAmountOption[] = [
  { label: '$50', centavos: 5000n },
  { label: '$100', centavos: 10000n },
  { label: '$200', centavos: 20000n },
  { label: '$500', centavos: 50000n },
  { label: '$1000', centavos: 100000n },
] as const;

export interface QuickAmountsProps {
  /** Called with the selected amount in centavos. */
  readonly onSelect: (centavos: bigint) => void;
  /** Called when "Exacto" (exact amount) is tapped. */
  readonly onExacto: () => void;
  /** Additional amounts beyond the default MXN bills. */
  readonly extraAmounts?: readonly QuickAmountOption[];
  /** Whether to show the "Exacto" button. Default true. */
  readonly showExacto?: boolean;
  readonly testID?: string;
}

const PILL: ViewStyle = {
  paddingHorizontal: 16,
  paddingVertical: 10,
  borderRadius: 9999,
  borderWidth: 2,
  borderColor: colors.black,
  backgroundColor: colors.yellowSoft,
};

function PillLabel({ icon, label }: { icon: 'banknote' | 'check'; label: string }): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" gap={6}>
      <Icon name={icon} size={14} color={colors.black} />
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold.toString()}
        fontSize={16}
        color={colors.black}
      >
        {label}
      </Text>
    </View>
  );
}

function AmountPill({ amt, onSelect }: {
  amt: QuickAmountOption; onSelect: (c: bigint) => void;
}): ReactElement {
  return (
    <Pressable
      key={amt.label}
      style={({ pressed }) => [PILL, pressed && { backgroundColor: colors.yellow }]}
      onPress={() => { impactLight(); onSelect(amt.centavos); }}
      testID={`quick-amount-${amt.label}`}
      accessibilityRole="button"
      accessibilityLabel={amt.label}
    >
      <PillLabel icon="banknote" label={amt.label} />
    </Pressable>
  );
}

function ExactoPill({ onExacto }: { onExacto: () => void }): ReactElement {
  return (
    <Pressable
      style={({ pressed }) => [
        PILL,
        { backgroundColor: pressed ? colors.green : colors.greenSoft },
      ]}
      onPress={() => { impactLight(); onExacto(); }}
      testID="quick-amount-exacto"
      accessibilityRole="button"
      accessibilityLabel="Exacto"
    >
      <PillLabel icon="check" label="Exacto" />
    </Pressable>
  );
}

export function QuickAmounts(props: QuickAmountsProps): ReactElement {
  const amounts = [...MXN_BILL_AMOUNTS, ...(props.extraAmounts ?? [])];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator
      contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}
      testID={props.testID ?? 'quick-amounts'}
    >
      {amounts.map((amt) => (
        <AmountPill key={amt.label} amt={amt} onSelect={props.onSelect} />
      ))}
      {(props.showExacto ?? true) && <ExactoPill onExacto={props.onExacto} />}
    </ScrollView>
  );
}
