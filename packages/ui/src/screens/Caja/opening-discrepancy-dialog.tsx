/**
 * OpeningDiscrepancyDialog — warns operator when opening amount
 * differs from the previous close by more than $50.
 *
 * Shows comparison card + "Volver a contar" / "Continuar" buttons.
 * On "Continuar", the turn opens and a DirectorAlert is created
 * by the AbrirCaja use case.
 *
 * Caja Overhaul — Phase B.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { Money } from '@cachink/domain';
import { formatMoney } from '@cachink/domain';
import { Btn } from '../../components/Btn/btn';
import { Card } from '../../components/Card/card';
import { Icon } from '../../components/Icon/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export interface OpeningDiscrepancyDialogProps {
  readonly previousClose: Money;
  readonly newOpening: Money;
  readonly difference: Money;
  readonly onGoBack: () => void;
  readonly onContinue: () => void;
  readonly submitting: boolean;
  readonly testID?: string;
}

function DiffCard(props: {
  previousClose: Money;
  newOpening: Money;
  difference: Money;
}): ReactElement {
  const { t } = useTranslation();
  const isNegative = props.difference < 0n;
  const diffColor = isNegative ? colors.red : colors.green;

  return (
    <Card variant="white" padding="md" fullWidth testID="discrepancy-card">
      <View gap={8}>
        <Text fontFamily={typography.fontFamily} fontSize={14} color={colors.gray600}>
          {t('caja.discrepancyCierreAnterior', {
            monto: formatMoney(props.previousClose),
          })}
        </Text>
        <Text fontFamily={typography.fontFamily} fontSize={14} color={colors.gray600}>
          {t('caja.discrepancyAbriendo', {
            monto: formatMoney(props.newOpening),
          })}
        </Text>
        <View
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          backgroundColor={isNegative ? colors.redSoft : colors.greenSoft}
          borderRadius={8}
          padding={12}
          marginTop={4}
        >
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.bold}
            fontSize={16}
            color={diffColor}
          >
            {t('caja.discrepancyDiff', { monto: formatMoney(props.difference) })}
          </Text>
          <Icon
            name="triangle-alert"
            size={20}
            color={diffColor}
          />
        </View>
      </View>
    </Card>
  );
}

export function OpeningDiscrepancyDialog(
  props: OpeningDiscrepancyDialogProps,
): ReactElement {
  const { t } = useTranslation();

  return (
    <View
      padding={16}
      gap={16}
      testID={props.testID ?? 'opening-discrepancy-dialog'}
    >
      <View flexDirection="row" alignItems="center" gap={8}>
        <Icon name="triangle-alert" size={24} color={colors.yellow} />
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.black}
          fontSize={20}
          color={colors.black}
        >
          {t('caja.discrepancyTitle')}
        </Text>
      </View>

      <DiffCard
        previousClose={props.previousClose}
        newOpening={props.newOpening}
        difference={props.difference}
      />

      <Text
        fontFamily={typography.fontFamily}
        fontSize={14}
        color={colors.gray600}
      >
        {t('caja.discrepancyNotice')}
      </Text>

      <View flexDirection="row" gap={12}>
        <View flex={1}>
          <Btn
            variant="ghost"
            onPress={props.onGoBack}
            fullWidth
            testID="discrepancy-go-back"
          >
            {t('caja.discrepancyGoBack')}
          </Btn>
        </View>
        <View flex={1}>
          <Btn
            variant="dark"
            onPress={props.onContinue}
            fullWidth
            loading={props.submitting}
            testID="discrepancy-continue"
          >
            {t('caja.discrepancyContinue')}
          </Btn>
        </View>
      </View>
    </View>
  );
}
