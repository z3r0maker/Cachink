/**
 * VentaCheckoutSheet — batch checkout modal.
 *
 * Opens from the sticky "Cobrar" footer. Shows the cart summary and
 * payment method via OptionCardGroup in grid layout (CLAUDE.md §6).
 *
 * Crédito is handled separately (Fix 7) — not shown here.
 * Payment methods are filtered by `useEnabledPaymentMethods` (Fix 8).
 *
 * On submit the route loops through items and records each as a separate
 * Sale (preserving the current "one cart item = one domain record" model).
 */
import { useMemo, useState, type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { Text, View } from '@tamagui/core';
import type { PaymentMethod } from '@cachink/domain';
import { formatMoney, type Money } from '@cachink/domain';
import { Btn, Modal } from '../../components/index';
import { OptionCardGroup, type OptionCardItem } from '../../components/OptionCardGroup/index';
import { colors, typography } from '../../theme';
import type { CartItem } from '../../hooks/use-cart';
import { useEnabledPaymentMethods } from '../../hooks/use-enabled-payment-methods';
import { CheckoutSummary } from './checkout-summary';

// ---------------------------------------------------------------------------
// Payment method option cards (Crédito removed — handled separately)
// ---------------------------------------------------------------------------

export const PAYMENT_OPTIONS: readonly OptionCardItem<PaymentMethod>[] = [
  { key: 'Efectivo', icon: 'banknote', label: 'Efectivo', description: 'Pago en efectivo' },
  { key: 'Transferencia', icon: 'wallet', label: 'Transferencia', description: 'SPEI o transferencia' },
  { key: 'Tarjeta', icon: 'credit-card', label: 'Tarjeta', description: 'Crédito o débito' },
  { key: 'QR/CoDi', icon: 'smartphone', label: 'QR/CoDi', description: 'Cobro con código QR' },
] as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface VentaCheckoutSheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly items: readonly CartItem[];
  readonly totalCentavos: Money;
  readonly onSubmit: (metodo: PaymentMethod) => void;
  readonly submitting?: boolean;
  readonly error?: Error | null;
  readonly testID?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VentaCheckoutSheet(props: VentaCheckoutSheetProps): ReactElement {
  const [metodo, setMetodo] = useState<PaymentMethod>('Efectivo');
  const enabledMethods = useEnabledPaymentMethods();

  const visibleOptions = useMemo(
    () => PAYMENT_OPTIONS.filter((o) => enabledMethods.includes(o.key)),
    [enabledMethods],
  );

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={`Cobrar ${formatMoney(props.totalCentavos)}`}
      testID={props.testID ?? 'venta-checkout-sheet'}
    >
      <ScrollView style={{ maxHeight: 480 }}>
        <View gap={16}>
          <CheckoutSummary items={props.items} />
          <OptionCardGroup<PaymentMethod>
            label="Método de pago"
            value={metodo}
            onChange={setMetodo}
            options={visibleOptions}
            layout="grid"
            testID="checkout-payment-method"
          />
          {props.error != null && (
            <Text
              fontFamily={typography.fontFamily}
              fontSize={12}
              color={colors.red}
              textAlign="center"
            >
              {props.error.message}
            </Text>
          )}
          <Btn
            variant="primary"
            fullWidth
            size="lg"
            onPress={() => props.onSubmit(metodo)}
            disabled={props.items.length === 0}
            loading={props.submitting === true}
            testID="checkout-submit"
          >
            {`Registrar ${formatMoney(props.totalCentavos)}`}
          </Btn>
        </View>
      </ScrollView>
    </Modal>
  );
}
