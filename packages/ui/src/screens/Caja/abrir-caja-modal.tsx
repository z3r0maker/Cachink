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
import { View, useMedia } from '@tamagui/core';
import type { Money } from '@cachink/domain';
import { ZERO, formatMoney } from '@cachink/domain';
import { Card } from '../../components/Card/card';
import {
  Numpad,
  NumpadDisplay,
  QuickAmounts,
  useNumpadInput,
} from '../../components/Numpad/index';
import type { QuickAmountOption } from '../../components/Numpad/index';
import { useTranslation } from '../../i18n/index';
import { colors, radii } from '../../theme';
import { AbrirCajaFooter } from './abrir-caja-footer';
import { AbrirCajaHeader } from './abrir-caja-header';

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

const BUILT_IN_AMOUNTS: readonly bigint[] = [50000n, 100000n];

function filterExtraAmounts(): readonly QuickAmountOption[] {
  return OPENING_AMOUNTS.filter(
    (a) => !BUILT_IN_AMOUNTS.includes(a.centavos),
  );
}

export function AbrirCajaModal(props: AbrirCajaModalProps): ReactElement {
  const { t } = useTranslation();
  const media = useMedia();
  const numpad = useNumpadInput();
  const isPhone = media.sm === true;

  const handleSubmit = (): void => {
    props.onSubmit(numpad.centavos, ZERO);
  };

  const buttonLabel =
    numpad.centavos > ZERO
      ? t('caja.abrirSubmitWith', { monto: formatMoney(numpad.centavos) })
      : t('caja.abrirSubmit');

  return (
    <View flex={1} testID={props.testID ?? 'abrir-caja-modal'}>
      <AbrirCajaScrollBody
        isPhone={isPhone}
        numpad={numpad}
      />
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

function AbrirCajaScrollBody(props: {
  isPhone: boolean;
  numpad: ReturnType<typeof useNumpadInput>;
}): ReactElement {
  const gap = props.isPhone ? 12 : 16;
  const { t } = useTranslation();

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingBottom: 100,
        gap,
        alignItems: 'center',
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View
        width="100%"
        height={6}
        backgroundColor={colors.yellow}
        borderRadius={radii[0]}
      />
      <AbrirCajaHeader t={t} />
      <AbrirCajaEntryCard
        isPhone={props.isPhone}
        numpad={props.numpad}
      />
    </ScrollView>
  );
}

function AbrirCajaEntryCard(props: {
  isPhone: boolean;
  numpad: ReturnType<typeof useNumpadInput>;
}): ReactElement {
  const numpadSize = props.isPhone ? 56 : 72;
  const gap = props.isPhone ? 12 : 16;

  return (
    <Card variant="white" fullWidth padding="md" elevation="raised">
      <View gap={gap} alignItems="center">
        <NumpadDisplay
          value={props.numpad.display}
          testID="abrir-numpad-display"
        />
        <QuickAmounts
          onSelect={(c) => props.numpad.setFromCentavos(c)}
          onExacto={() => {}}
          showExacto={false}
          extraAmounts={filterExtraAmounts()}
          testID="abrir-quick-amounts"
        />
        <Numpad
          onPress={props.numpad.onKey}
          buttonSize={numpadSize}
          testID="abrir-numpad"
        />
      </View>
    </Card>
  );
}
