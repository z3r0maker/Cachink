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

export function QuickAmounts(props: QuickAmountsProps): ReactElement {
  const amounts = [
    ...MXN_BILL_AMOUNTS,
    ...(props.extraAmounts ?? []),
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}
      testID={props.testID ?? 'quick-amounts'}
    >
      {amounts.map((amt) => (
        <Pressable
          key={amt.label}
          style={({ pressed }) => [
            PILL,
            pressed && { backgroundColor: colors.yellow },
          ]}
          onPress={() => {
            impactLight();
            props.onSelect(amt.centavos);
          }}
          testID={`quick-amount-${amt.label}`}
          accessibilityRole="button"
          accessibilityLabel={amt.label}
        >
          <View flexDirection="row" alignItems="center" gap={6}>
            <Icon name="banknote" size={14} color={colors.black} />
            <Text
              fontFamily={typography.fontFamily}
              fontWeight={typography.weights.bold.toString()}
              fontSize={16}
              color={colors.black}
            >
              {amt.label}
            </Text>
          </View>
        </Pressable>
      ))}
      <Pressable
        style={({ pressed }) => [
          PILL,
          { backgroundColor: pressed ? colors.green : colors.greenSoft },
        ]}
        onPress={() => {
          impactLight();
          props.onExacto();
        }}
        testID="quick-amount-exacto"
        accessibilityRole="button"
        accessibilityLabel="Exacto"
      >
        <View flexDirection="row" alignItems="center" gap={6}>
          <Icon name="check" size={14} color={colors.black} />
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.bold.toString()}
            fontSize={16}
            color={colors.black}
          >
            Exacto
          </Text>
        </View>
      </Pressable>
    </ScrollView>
  );
}
