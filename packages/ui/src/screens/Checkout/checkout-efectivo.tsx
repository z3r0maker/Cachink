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
} from '../../components/Numpad/index';
import { colors, radii, typography } from '../../theme';
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

export function CheckoutEfectivo(
  props: CheckoutEfectivoProps,
): ReactElement {
  const input = useNumpadInput();

  const cambio =
    input.centavos >= props.totalCentavos
      ? input.centavos - props.totalCentavos
      : ZERO;

  const canSubmit =
    input.centavos >= props.totalCentavos && input.centavos > ZERO;

  const handleExacto = useCallback(() => {
    input.setFromCentavos(props.totalCentavos);
  }, [input, props.totalCentavos]);

  const showCambio = input.centavos > ZERO;
  const showCashWarning =
    cambio > ZERO &&
    props.efectivoEnCaja != null &&
    cambio > props.efectivoEnCaja;

  return (
    <View flex={1} testID={props.testID ?? 'checkout-efectivo'}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 100,
          gap: 16,
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Yellow accent strip */}
        <View
          width="100%"
          height={6}
          backgroundColor={colors.yellow}
          borderRadius={radii[0]}
        />

        {/* Total context header */}
        <TotalHeader totalCentavos={props.totalCentavos} />

        {/* Payment Entry Card */}
        <Card variant="white" fullWidth padding="md" elevation="raised">
          <View gap={16} alignItems="center">
            <Text
              fontFamily={typography.fontFamily}
              fontWeight={typography.weights.semibold.toString()}
              fontSize={14}
              color={colors.gray600}
              letterSpacing={typography.letterSpacing.wide}
              style={{ textTransform: 'uppercase' }}
            >
              Efectivo recibido
            </Text>

            <NumpadDisplay value={input.display} />

            <QuickAmounts
              onSelect={input.setFromCentavos}
              onExacto={handleExacto}
            />

            <Numpad onPress={input.onKey} />
          </View>
        </Card>

        {/* Cambio Card */}
        <CambioCard
          cambio={cambio}
          visible={showCambio}
          showCashWarning={showCashWarning}
        />
      </ScrollView>

      {/* Sticky footer CTA */}
      <CheckoutFooter
        totalCentavos={props.totalCentavos}
        canSubmit={canSubmit}
        submitting={props.submitting === true}
        onConfirm={() => props.onConfirm(input.centavos)}
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
        fontSize={14}
        color={colors.gray400}
      >
        Total a cobrar
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black.toString()}
        fontSize={28}
        color={colors.black}
        letterSpacing={typography.letterSpacing.tight}
      >
        {formatMoney(props.totalCentavos)}
      </Text>
    </View>
  );
}
