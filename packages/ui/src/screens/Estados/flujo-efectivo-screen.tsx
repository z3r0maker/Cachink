/**
 * FlujoEfectivoScreen — NIF B-2 Flujo de Efectivo (P1C-M8-T04, Slice 3 C15).
 *
 * Two sections (Operación, Inversión) with a running-total hero at the
 * bottom. Pure presentation.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { formatMoney, type FlujoDeEfectivo, type Money } from '@cachink/domain';
import { Card, Kpi, SectionTitle } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export interface FlujoEfectivoScreenProps {
  readonly flujo: FlujoDeEfectivo | null;
  readonly periodoLabel: string;
  readonly testID?: string;
}

interface SectionCardProps {
  readonly label: string;
  readonly value: Money;
  readonly testID: string;
}

function SectionCard(props: SectionCardProps): ReactElement {
  return (
    <Card padding="md" fullWidth testID={props.testID}>
      <View
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        paddingVertical={8}
      >
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.bold}
          fontSize={14}
          color={colors.ink}
        >
          {props.label}
        </Text>
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.black}
          fontSize={18}
          color={props.value >= 0n ? colors.black : colors.red}
        >
          {formatMoney(props.value)}
        </Text>
      </View>
    </Card>
  );
}

function EmptyCard(props: { title: string; body: string }): ReactElement {
  return (
    <Card testID="flujo-efectivo-empty" padding="md" fullWidth>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={14}
        color={colors.ink}
      >
        {props.title}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={13}
        color={colors.gray600}
        marginTop={4}
      >
        {props.body}
      </Text>
    </Card>
  );
}

export function FlujoEfectivoScreen(props: FlujoEfectivoScreenProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View testID={props.testID ?? 'flujo-efectivo-screen'} gap={14}>
      <SectionTitle title={props.periodoLabel} />
      {props.flujo === null ? (
        <EmptyCard title={t('estados.emptyPeriodTitle')} body={t('estados.emptyPeriodBody')} />
      ) : (
        <View gap={12}>
          <SectionCard
            label={t('estados.flujoOperacion')}
            value={props.flujo.operacion}
            testID="flujo-operacion"
          />
          <SectionCard
            label={t('estados.flujoInversion')}
            value={props.flujo.inversion}
            testID="flujo-inversion"
          />
          <Kpi
            label={t('estados.flujoTotal')}
            value={formatMoney(props.flujo.total)}
            tone={props.flujo.total >= 0n ? 'positive' : 'negative'}
            testID="flujo-total"
          />
        </View>
      )}
    </View>
  );
}
