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
import { colors, fontSizes, typography } from '../../theme';
import type { CartItem } from '../../hooks/use-cart';
import { useEnabledPaymentMethods } from '../../hooks/use-enabled-payment-methods';
import { CheckoutSummary } from './checkout-summary';

// ---------------------------------------------------------------------------
// Payment method option cards (Crédito removed — handled separately)
// ---------------------------------------------------------------------------

export const PAYMENT_OPTIONS: readonly OptionCardItem<PaymentMethod>[] = [
  { key: 'Efectivo', icon: 'banknote', label: 'Efectivo', description: 'Pago en efectivo' },
  {
    key: 'Transferencia',
    icon: 'wallet',
    label: 'Transferencia',
    description: 'SPEI o transferencia',
  },
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

function ErrorText(props: { error?: Error | null }): ReactElement | null {
  if (props.error == null) return null;
  return (
    <Text
      fontFamily={typography.fontFamily}
      fontSize={fontSizes.xs}
      color={colors.redText}
      textAlign="center"
    >
      {props.error.message}
    </Text>
  );
}

interface SheetBodyProps {
  readonly items: readonly CartItem[];
  readonly metodo: PaymentMethod;
  readonly onMetodoChange: (m: PaymentMethod) => void;
  readonly visibleOptions: readonly OptionCardItem<PaymentMethod>[];
  readonly error?: Error | null;
  readonly totalCentavos: Money;
  readonly onSubmit: (metodo: PaymentMethod) => void;
  readonly submitting?: boolean;
}

function SheetSubmitBtn(
  props: Pick<SheetBodyProps, 'totalCentavos' | 'metodo' | 'onSubmit' | 'submitting'> & {
    disabled: boolean;
  },
): ReactElement {
  return (
    <Btn
      variant="primary"
      fullWidth
      size="lg"
      onPress={() => props.onSubmit(props.metodo)}
      disabled={props.disabled}
      loading={props.submitting === true}
      testID="checkout-submit"
    >
      {`Registrar ${formatMoney(props.totalCentavos)}`}
    </Btn>
  );
}

function SheetBody(props: SheetBodyProps): ReactElement {
  return (
    <ScrollView style={{ maxHeight: 480 }}>
      <View gap={16}>
        <CheckoutSummary items={props.items} />
        <OptionCardGroup<PaymentMethod>
          label="Método de pago"
          value={props.metodo}
          onChange={props.onMetodoChange}
          options={props.visibleOptions}
          layout="grid"
          testID="checkout-payment-method"
        />
        <ErrorText error={props.error} />
        <SheetSubmitBtn
          totalCentavos={props.totalCentavos}
          metodo={props.metodo}
          onSubmit={props.onSubmit}
          submitting={props.submitting}
          disabled={props.items.length === 0}
        />
      </View>
    </ScrollView>
  );
}

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
      <SheetBody
        items={props.items}
        metodo={metodo}
        onMetodoChange={setMetodo}
        visibleOptions={visibleOptions}
        error={props.error}
        totalCentavos={props.totalCentavos}
        onSubmit={props.onSubmit}
        submitting={props.submitting}
      />
    </Modal>
  );
}
