/**
 * CheckoutEfectivo — cash numpad checkout screen.
 *
 * The most important POS screen: operator enters how much the
 * customer paid, change is computed live. "Registrar" is disabled
 * until the entered amount ≥ sale total.
 *
 * ## UX redesign (Audit May 2026)
 *
 * - "Total a cobrar" header at top for operator context
 * - Yellow accent strip for brand identity
 * - Payment entry wrapped in a Card for visual grouping
 * - Cambio as a separate green-bordered card
 * - Cash-insufficient amber warning (soft, not blocking)
 * - Sticky Registrar CTA at the bottom
 * - All emojis replaced with Lucide icons
 */

import { type ReactElement, useCallback } from 'react';
import { ScrollView } from 'react-native';
import { Text, View } from '@tamagui/core';
import { formatMoney, type Money, ZERO } from '@cachink/domain';
import { Card } from '../../components/Card/card';
import {
  Numpad,
  NumpadDisplay,
  QuickAmounts,
  useNumpadInput,
  type NumpadKey,
} from '../../components/Numpad/index';
import { colors, fontSizes, radii, typography } from '../../theme';
import { CambioCard } from './cambio-card';
import { CheckoutFooter } from './checkout-footer';

export interface CheckoutEfectivoProps {
  /** Total to pay in centavos. */
  readonly totalCentavos: Money;
  /** Called with efectivoRecibido (centavos) on confirm. */
  readonly onConfirm: (efectivoRecibidoCentavos: Money) => void;
  readonly submitting?: boolean;
  /**
   * Cash currently in the register (centavos). When provided, shows
   * a warning if the change exceeds available cash.
   */
  readonly efectivoEnCaja?: Money | null;
  readonly testID?: string;
}

function PaymentEntryCard(props: {
  display: string;
  onKey: (k: NumpadKey) => void;
  setFromCentavos: (c: Money) => void;
  onExacto: () => void;
}): ReactElement {
  return (
    <Card variant="white" fullWidth padding="md" elevation="raised">
      <View gap={16} alignItems="center">
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.semibold.toString()}
          fontSize={fontSizes.md}
          color={colors.gray600}
          letterSpacing={typography.letterSpacing.wide}
          style={{ textTransform: 'uppercase' }}
        >
          Efectivo recibido
        </Text>
        <NumpadDisplay value={props.display} />
        <QuickAmounts onSelect={props.setFromCentavos} onExacto={props.onExacto} />
        <Numpad onPress={props.onKey} />
      </View>
    </Card>
  );
}

function useEfectivoState(totalCentavos: Money, efectivoEnCaja?: Money | null) {
  const input = useNumpadInput();

  const cambio = input.centavos >= totalCentavos ? input.centavos - totalCentavos : ZERO;

  const canSubmit = input.centavos >= totalCentavos && input.centavos > ZERO;
  const handleExacto = useCallback(() => {
    input.setFromCentavos(totalCentavos);
  }, [input, totalCentavos]);

  const showCambio = input.centavos > ZERO;
  const showCashWarning = cambio > ZERO && efectivoEnCaja != null && cambio > efectivoEnCaja;

  return { input, cambio, canSubmit, handleExacto, showCambio, showCashWarning };
}

const scrollStyle = {
  paddingHorizontal: 20,
  paddingBottom: 100,
  gap: 16,
  alignItems: 'center' as const,
};

export function CheckoutEfectivo(props: CheckoutEfectivoProps): ReactElement {
  const s = useEfectivoState(props.totalCentavos, props.efectivoEnCaja);

  return (
    <View flex={1} testID={props.testID ?? 'checkout-efectivo'}>
      <ScrollView contentContainerStyle={scrollStyle} showsVerticalScrollIndicator={false}>
        <View width="100%" height={6} backgroundColor={colors.yellow} borderRadius={radii[0]} />
        <TotalHeader totalCentavos={props.totalCentavos} />
        <PaymentEntryCard
          display={s.input.display}
          onKey={s.input.onKey}
          setFromCentavos={s.input.setFromCentavos}
          onExacto={s.handleExacto}
        />
        <CambioCard cambio={s.cambio} visible={s.showCambio} showCashWarning={s.showCashWarning} />
      </ScrollView>
      <CheckoutFooter
        totalCentavos={props.totalCentavos}
        canSubmit={s.canSubmit}
        submitting={props.submitting === true}
        onConfirm={() => props.onConfirm(s.input.centavos)}
      />
    </View>
  );
}

// ─── Sub-component ──────────────────────────────────────────────

interface TotalHeaderProps {
  readonly totalCentavos: Money;
}

function TotalHeader(props: TotalHeaderProps): ReactElement {
  return (
    <View alignItems="center" gap={4} paddingVertical={8}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium.toString()}
        fontSize={fontSizes.md}
        color={colors.textMuted}
      >
        Total a cobrar
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black.toString()}
        fontSize={fontSizes.xl4}
        color={colors.black}
        letterSpacing={typography.letterSpacing.tight}
      >
        {formatMoney(props.totalCentavos)}
      </Text>
    </View>
  );
}
