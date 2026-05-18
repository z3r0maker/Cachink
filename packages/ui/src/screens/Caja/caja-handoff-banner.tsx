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
  readonly otherUserName: string;
  readonly openingAmount: Money;
  readonly onConfirm: () => void;
  readonly onDifferent: () => void;
  readonly submitting?: boolean;
  readonly testID?: string;
}

export function CajaHandoffBanner(props: CajaHandoffBannerProps): ReactElement {
  const { t } = useTranslation();
  return (
    <Card variant="white" padding="lg" fullWidth testID={props.testID ?? 'caja-handoff-banner'}>
      <View gap={12}>
        <HandoffHeader name={props.otherUserName} t={t} />
        <Text fontFamily={typography.fontFamily} fontSize={14} color={colors.gray600}>
          {t('caja.handoffDescription', { monto: formatMoney(props.openingAmount) })}
        </Text>
        <HandoffActions
          onConfirm={props.onConfirm}
          onDifferent={props.onDifferent}
          submitting={props.submitting}
          t={t}
        />
      </View>
    </Card>
  );
}

type T = ReturnType<typeof useTranslation>['t'];

function HandoffHeader(props: { name: string; t: T }): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" gap={10}>
      <Icon name="users" size={24} color={colors.green} />
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={'700'}
        fontSize={16}
        color={colors.black}
        flex={1}
      >
        {props.t('caja.handoffTitle', { name: props.name })}
      </Text>
    </View>
  );
}

function HandoffActions(props: {
  onConfirm: () => void;
  onDifferent: () => void;
  submitting?: boolean;
  t: T;
}): ReactElement {
  return (
    <View gap={12}>
      <Btn
        variant="primary"
        onPress={props.onConfirm}
        fullWidth
        loading={props.submitting}
        testID="caja-handoff-confirm"
      >
        {props.t('caja.handoffConfirm')}
      </Btn>
      <Btn
        variant="ghost"
        onPress={props.onDifferent}
        fullWidth
        testID="caja-handoff-different"
      >
        {props.t('caja.handoffDifferent')}
      </Btn>
    </View>
  );
}
