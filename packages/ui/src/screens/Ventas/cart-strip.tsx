/**
 * CartStrip — inline mini-cart showing accumulated items between the
 * product grid and the sticky "Cobrar" footer.
 *
 * Header shows "Carrito (N)" + "Vaciar" link (Enhancement D).
 * Each row handled by `CartRow` in cart-strip-row.tsx.
 *
 * Shared between Ventas (yellow) and Merma (red, Enhancement G).
 */
import { useState, type ReactElement } from 'react';
import { Pressable } from 'react-native';
import { Text, View } from '@tamagui/core';
import type { ProductId } from '@cachink/domain';
import { ConfirmDialog } from '../../components/ConfirmDialog/index';
import { colors, fontSizes, typography } from '../../theme';
import type { CartItem } from '../../hooks/use-cart';
import { CartRow } from './cart-strip-row';

export interface CartStripProps {
  readonly items: readonly CartItem[];
  readonly onRemoveOne: (productoId: ProductId) => void;
  readonly onRemoveAll: (productoId: ProductId) => void;
  readonly onClear: () => void;
  readonly variant?: 'yellow' | 'red';
  readonly testID?: string;
}

function StripHeader(props: {
  count: number;
  onClearRequest: () => void;
  variant: 'yellow' | 'red';
}): ReactElement {
  const accent = props.variant === 'red' ? colors.red : colors.yellow;
  return (
    <View flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom={8}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={fontSizes.sm}
        color={colors.black}
        letterSpacing={typography.letterSpacing.wide}
        style={{ textTransform: 'uppercase' }}
      >
        Carrito ({props.count})
      </Text>
      <Pressable onPress={props.onClearRequest} hitSlop={8} testID="cart-strip-clear">
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.semibold}
          fontSize={fontSizes.xs}
          color={accent}
        >
          Vaciar
        </Text>
      </Pressable>
    </View>
  );
}

export function CartStrip(props: CartStripProps): ReactElement {
  const variant = props.variant ?? 'yellow';
  const [clearOpen, setClearOpen] = useState(false);

  return (
    <View testID={props.testID ?? 'cart-strip'} paddingVertical={8}>
      <StripHeader
        count={props.items.length}
        onClearRequest={() => setClearOpen(true)}
        variant={variant}
      />
      {props.items.map((item) => (
        <CartRow
          key={item.productoId}
          item={item}
          onRemoveOne={() => props.onRemoveOne(item.productoId)}
          onRemoveAll={() => props.onRemoveAll(item.productoId)}
        />
      ))}
      <ConfirmDialog
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        onConfirm={() => {
          props.onClear();
          setClearOpen(false);
        }}
        title="¿Vaciar carrito?"
        description="Se eliminarán todos los productos del carrito."
        confirmLabel="Vaciar"
        tone="danger"
      />
    </View>
  );
}
