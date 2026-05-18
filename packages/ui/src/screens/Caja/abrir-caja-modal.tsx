/**
 * AbrirCajaModal — cash drawer opening form with Numpad.
 *
 * Redesigned for phone viewports (UX Audit May 2026):
 * - Yellow accent strip for brand identity
 * - Header card with context question
 * - Payment entry wrapped in a Card for visual grouping
 * - Numpad uses 56px buttons on phones (72px on tablets)
 * - Sticky CTA footer pinned at bottom (always reachable)
 *
 * Caja Overhaul — Phase B.
 */

import { type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { Text, View, useMedia } from '@tamagui/core';
import type { Money } from '@cachink/domain';
import { ZERO, formatMoney } from '@cachink/domain';
import { Card } from '../../components/Card/card';
import { Icon } from '../../components/Icon/index';
import {
  Numpad,
  NumpadDisplay,
  QuickAmounts,
  useNumpadInput,
} from '../../components/Numpad/index';
import type { QuickAmountOption } from '../../components/Numpad/index';
import { useTranslation } from '../../i18n/index';
import { colors, radii, typography } from '../../theme';
import { AbrirCajaFooter } from './abrir-caja-footer';

export interface AbrirCajaModalProps {
  /** Pre-filled from previous turn's cierre amount (handoff). */
  readonly suggestedAmount: Money | null;
  /** Previous turn's cierre amount (for discrepancy check). */
  readonly previousCloseAmount: Money | null;
  readonly onSubmit: (apertura: Money, adicional: Money) => void;
  readonly submitting: boolean;
  readonly testID?: string;
}

/** Common opening balances for Mexican POS. */
const OPENING_AMOUNTS: readonly QuickAmountOption[] = [
  { label: '$500', centavos: 50000n },
  { label: '$1000', centavos: 100000n },
  { label: '$2000', centavos: 200000n },
  { label: '$3000', centavos: 300000n },
  { label: '$5000', centavos: 500000n },
] as const;

export function AbrirCajaModal(props: AbrirCajaModalProps): ReactElement {
  const { t } = useTranslation();
  const media = useMedia();
  const numpad = useNumpadInput();
  const isPhone = media.sm === true;
  const numpadSize = isPhone ? 56 : 72;

  const handleSubmit = (): void => {
    props.onSubmit(numpad.centavos, ZERO);
  };

  const buttonLabel =
    numpad.centavos > ZERO
      ? t('caja.abrirSubmitWith', { monto: formatMoney(numpad.centavos) })
      : t('caja.abrirSubmit');

  return (
    <View flex={1} testID={props.testID ?? 'abrir-caja-modal'}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 100,
          gap: isPhone ? 12 : 16,
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Yellow accent strip */}
        <View
          width="100%"
          height={6}
          backgroundColor={colors.yellow}
          borderRadius={radii[0]}
        />

        {/* Header Card */}
        <AbrirCajaHeader t={t} />

        {/* Entry Card — numpad + display + quick amounts */}
        <Card variant="white" fullWidth padding="md" elevation="raised">
          <View gap={isPhone ? 12 : 16} alignItems="center">
            <NumpadDisplay
              value={numpad.display}
              testID="abrir-numpad-display"
            />
            <QuickAmounts
              onSelect={(c) => numpad.setFromCentavos(c)}
              onExacto={() => {}}
              showExacto={false}
              extraAmounts={OPENING_AMOUNTS.filter(
                (a) =>
                  !([50000n, 100000n] as readonly bigint[]).includes(
                    a.centavos,
                  ),
              )}
              testID="abrir-quick-amounts"
            />
            <Numpad
              onPress={numpad.onKey}
              buttonSize={numpadSize}
              testID="abrir-numpad"
            />
          </View>
        </Card>
      </ScrollView>

      {/* Sticky footer CTA */}
      <AbrirCajaFooter
        buttonLabel={buttonLabel}
        canSubmit={numpad.centavos > ZERO}
        submitting={props.submitting}
        onSubmit={handleSubmit}
      />
    </View>
  );
}

// --- Sub-components ---

function AbrirCajaHeader({
  t,
}: {
  t: ReturnType<typeof useTranslation>['t'];
}): ReactElement {
  return (
    <Card variant="white" padding="md" fullWidth testID="abrir-caja-header">
      <View flexDirection="row" alignItems="center" gap={10}>
        <Icon name="landmark" size={28} color={colors.green} />
        <View flex={1} gap={2}>
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={'900'}
            fontSize={18}
            color={colors.black}
            children={t('caja.abrirQuestion') as string}
          />
          <Text
            fontFamily={typography.fontFamily}
            fontSize={14}
            color={colors.gray600}
            children={t('caja.abrirHint') as string}
          />
        </View>
      </View>
    </Card>
  );
}
