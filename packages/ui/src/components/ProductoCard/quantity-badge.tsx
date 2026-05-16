/**
 * QuantityBadge — small overlay circle showing how many units of a
 * product are in the cart (Enhancement A).
 *
 * Positioned absolute top-right of the parent; the parent must have
 * `position: 'relative'` or `overflow: 'visible'` for the badge to
 * show outside the card bounds.
 *
 * Two colour variants:
 *   - `yellow` (default) — Ventas  (brand yellow badge)
 *   - `red` — Merma (redSoft accent, Enhancement G)
 */
import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { colors, typography } from '../../theme';

export type BadgeVariant = 'yellow' | 'red';

export interface QuantityBadgeProps {
  readonly count: number;
  readonly variant?: BadgeVariant;
}

const SIZE = 24;

function resolveBg(variant: BadgeVariant): string {
  return variant === 'red' ? colors.red : colors.yellow;
}

function resolveFg(variant: BadgeVariant): string {
  return variant === 'red' ? colors.white : colors.black;
}

export function QuantityBadge(props: QuantityBadgeProps): ReactElement | null {
  if (props.count <= 0) return null;
  const variant = props.variant ?? 'yellow';
  return (
    <View
      testID="quantity-badge"
      position="absolute"
      top={-6}
      right={-6}
      zIndex={10}
      width={SIZE}
      height={SIZE}
      borderRadius={SIZE / 2}
      backgroundColor={resolveBg(variant)}
      borderWidth={2}
      borderColor={colors.black}
      alignItems="center"
      justifyContent="center"
    >
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={11}
        color={resolveFg(variant)}
        numberOfLines={1}
      >
        ×{props.count}
      </Text>
    </View>
  );
}
