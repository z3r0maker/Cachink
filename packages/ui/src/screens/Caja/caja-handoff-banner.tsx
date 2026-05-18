/**
 * CajaHandoffBanner — shown when another user already has an open turn.
 *
 * Offers the current user two options:
 *   1. "Confirmar monto" — open their turn with the same amount
 *   2. "Registrar diferente" — show the numpad to enter a different amount
 *
 * QA Bug Fix #11: shared caja turn awareness for single-device shops.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { Money } from '@cachink/domain';
import { formatMoney } from '@cachink/domain';
import { Btn } from '../../components/index';
import { Card } from '../../components/Card/card';
import { Icon } from '../../components/Icon/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export interface CajaHandoffBannerProps {
  /** Name of the user who opened the existing turn. */
  readonly otherUserName: string;
  /** The opening amount of the existing turn. */
  readonly openingAmount: Money;
  /** Confirm the same amount — creates the current user's turn instantly. */
  readonly onConfirm: () => void;
  /** Show the numpad so user can enter a different amount. */
  readonly onDifferent: () => void;
  readonly submitting?: boolean;
  readonly testID?: string;
}

export function CajaHandoffBanner(props: CajaHandoffBannerProps): ReactElement {
  const { t } = useTranslation();
  return (
    <Card variant="white" padding="lg" fullWidth testID={props.testID ?? 'caja-handoff-banner'}>
      <View gap={12}>
        <View flexDirection="row" alignItems="center" gap={10}>
          <Icon name="users" size={24} color={colors.green} />
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={'700'}
            fontSize={16}
            color={colors.black}
            flex={1}
          >
            {t('caja.handoffTitle', { name: props.otherUserName })}
          </Text>
        </View>
        <Text
          fontFamily={typography.fontFamily}
          fontSize={14}
          color={colors.gray600}
        >
          {t('caja.handoffDescription', { monto: formatMoney(props.openingAmount) })}
        </Text>
        <Btn
          variant="primary"
          onPress={props.onConfirm}
          fullWidth
          loading={props.submitting}
          testID="caja-handoff-confirm"
        >
          {t('caja.handoffConfirm')}
        </Btn>
        <Btn
          variant="ghost"
          onPress={props.onDifferent}
          fullWidth
          testID="caja-handoff-different"
        >
          {t('caja.handoffDifferent')}
        </Btn>
      </View>
    </Card>
  );
}
