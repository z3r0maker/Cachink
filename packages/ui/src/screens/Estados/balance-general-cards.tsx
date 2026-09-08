/**
 * Summary and empty-state cards for the Balance General screen (NIF B-6).
 *
 * Split out of `balance-general-screen.tsx`, which had grown past the §2.6
 * 200-line file budget. Mirrors the existing `resultados-rows.tsx` /
 * `flujo-components.tsx` split in this folder. Pure presentation.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { formatMoney, type BalanceGeneral, type Money, ZERO } from '@cachink/domain';
import { Card, DeltaIndicator, HealthIndicator, SectionTitle } from '../../components/index';
import type { useTranslation } from '../../i18n/index';
import { colors, fontSizes, typography } from '../../theme';
import { moneyToNumber } from '../../charts/chart-tokens';

type T = ReturnType<typeof useTranslation>['t'];

interface RowProps {
  readonly label: string;
  readonly value: Money;
  readonly testID?: string;
}

export function Row(props: RowProps): ReactElement {
  return (
    <View
      testID={props.testID}
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      paddingVertical={6}
    >
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={fontSizes.sm}
        color={colors.ink}
      >
        {props.label}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={fontSizes.md}
        color={colors.black}
      >
        {formatMoney(props.value)}
      </Text>
    </View>
  );
}

/** The punchline: is capital positive, and what does the balance say in words. */
function resumen(
  balance: BalanceGeneral,
  t: T,
): { tone: 'healthy' | 'critical'; verdict: string; sentence: string } {
  const healthy = balance.capital.total >= ZERO;
  return {
    tone: healthy ? 'healthy' : 'critical',
    verdict: healthy ? t('estados.balanceVerdictPositive') : t('estados.balanceVerdictNegative'),
    sentence: t('estados.balanceResumenSentence', {
      activo: formatMoney(balance.activo.total),
      capital: formatMoney(balance.capital.total),
    }),
  };
}

export function ResumenCard({
  balance,
  prior,
  t,
}: {
  balance: BalanceGeneral;
  prior?: BalanceGeneral | null;
  t: T;
}): ReactElement {
  const { tone, verdict, sentence } = resumen(balance, t);
  return (
    <Card testID="balance-resumen-card" padding="md" fullWidth>
      <SectionTitle title={t('estados.resultadosResumenTitle')} />
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={fontSizes.md}
        color={colors.ink}
        marginTop={4}
        marginBottom={8}
      >
        {sentence}
      </Text>
      <HealthIndicator tone={tone} verdict={verdict} testID="balance-resumen-health" />
      {prior !== undefined && prior !== null && (
        <DeltaIndicator
          current={moneyToNumber(balance.activo.total)}
          previous={moneyToNumber(prior.activo.total)}
          format="percent"
          periodLabel={t('estados.deltaVsMesAnterior')}
          testID="balance-resumen-delta"
        />
      )}
    </Card>
  );
}

export function EmptyCard(props: { title: string; body: string }): ReactElement {
  return (
    <Card testID="balance-general-empty" padding="md" fullWidth>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={fontSizes.md}
        color={colors.ink}
      >
        {props.title}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={fontSizes.sm}
        color={colors.gray600}
        marginTop={4}
      >
        {props.body}
      </Text>
    </Card>
  );
}
