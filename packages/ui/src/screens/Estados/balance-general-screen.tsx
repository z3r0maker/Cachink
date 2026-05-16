/**
 * BalanceGeneralScreen — NIF B-6.
 *
 * Restructured with punchline-first ResumenCard, HelpAccordions
 * on every term, and delta indicator on Total Activo.
 *
 * Pure presentation.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { formatMoney, type BalanceGeneral, type Money, ZERO } from '@cachink/domain';
import {
  Card,
  DeltaIndicator,
  HelpAccordion,
  HealthIndicator,
  Kpi,
  SectionTitle,
  Tag,
} from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';
import { StackedBar } from '../../charts/StackedBar/index';
import { formatChartLabel, moneyToNumber } from '../../charts/chart-tokens';

export interface BalanceGeneralScreenProps {
  readonly balance: BalanceGeneral | null;
  readonly periodoLabel: string;
  readonly priorBalance?: BalanceGeneral | null;
  readonly testID?: string;
}

type T = ReturnType<typeof useTranslation>['t'];

interface RowProps {
  readonly label: string;
  readonly value: Money;
  readonly testID?: string;
}

function Row(props: RowProps): ReactElement {
  return (
    <View
      testID={props.testID}
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      paddingVertical={6}
    >
      <Text fontFamily={typography.fontFamily} fontWeight={typography.weights.medium} fontSize={13} color={colors.ink}>
        {props.label}
      </Text>
      <Text fontFamily={typography.fontFamily} fontWeight={typography.weights.bold} fontSize={14} color={colors.black}>
        {formatMoney(props.value)}
      </Text>
    </View>
  );
}

function ResumenCard({ balance, prior, t }: { balance: BalanceGeneral; prior?: BalanceGeneral | null; t: T }): ReactElement {
  const capitalTone = balance.capital.total >= ZERO ? 'healthy' : 'critical';
  const capitalVerdict = balance.capital.total >= ZERO
    ? t('estados.balanceVerdictPositive')
    : t('estados.balanceVerdictNegative');
  const sentence = t('estados.balanceResumenSentence', {
    activo: formatMoney(balance.activo.total),
    capital: formatMoney(balance.capital.total),
  });
  return (
    <Card testID="balance-resumen-card" padding="md" fullWidth>
      <SectionTitle title={t('estados.resultadosResumenTitle')} />
      <Text fontFamily={typography.fontFamily} fontWeight={typography.weights.medium} fontSize={14} color={colors.ink} marginTop={4} marginBottom={8}>
        {sentence}
      </Text>
      <HealthIndicator tone={capitalTone} verdict={capitalVerdict} testID="balance-resumen-health" />
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

function ActivoCard({ balance, t }: { balance: BalanceGeneral; t: T }): ReactElement {
  return (
    <Card testID="balance-activo-card" padding="md" fullWidth>
      <SectionTitle title={t('estados.balanceActivo')} />
      <Row label={t('estados.balanceActivoEfectivo')} value={balance.activo.efectivo} testID="balance-activo-efectivo" />
      <HelpAccordion subtitle={t('estados.balanceActivoEfectivoSubtitle')} detail={t('estados.balanceActivoEfectivoDetail')} />
      <Row label={t('estados.balanceActivoInventarios')} value={balance.activo.inventarios} testID="balance-activo-inventarios" />
      <HelpAccordion subtitle={t('estados.balanceActivoInventariosSubtitle')} detail={t('estados.balanceActivoInventariosDetail')} />
      <Row label={t('estados.balanceActivoCxC')} value={balance.activo.cuentasPorCobrar} testID="balance-activo-cxc" />
      <HelpAccordion subtitle={t('estados.balanceActivoCxCSubtitle')} detail={t('estados.balanceActivoCxCDetail')} />
      <StackedBar
        segments={[
          { label: t('estados.balanceActivoEfectivo'), value: moneyToNumber(balance.activo.efectivo), color: colors.green },
          { label: t('estados.balanceActivoInventarios'), value: moneyToNumber(balance.activo.inventarios), color: colors.blue },
          { label: t('estados.balanceActivoCxC'), value: moneyToNumber(balance.activo.cuentasPorCobrar), color: colors.warning },
        ]}
        formatValue={formatChartLabel}
        testID="balance-activo-bar"
      />
      <Kpi label={t('estados.balanceActivoTotal')} value={formatMoney(balance.activo.total)} align="right" testID="balance-activo-total" />
    </Card>
  );
}

function PasivoCapitalCard({ balance, t }: { balance: BalanceGeneral; t: T }): ReactElement {
  const tone: 'positive' | 'negative' | 'neutral' = balance.capital.utilidadDelPeriodo >= 0n ? 'positive' : 'negative';
  return (
    <Card testID="balance-pasivo-capital-card" padding="md" fullWidth>
      <SectionTitle title={t('estados.balancePasivo')} />
      <HelpAccordion subtitle={t('estados.balancePasivoSubtitle')} detail={t('estados.balancePasivoDetail')} />
      {balance.pasivo.total === 0n ? (
        <View paddingVertical={6} testID="balance-pasivo-empty">
          <Tag variant="neutral">{t('estados.balancePasivoCero')}</Tag>
        </View>
      ) : (
        <Row label={t('estados.balancePasivoTotal')} value={balance.pasivo.total} testID="balance-pasivo-total" />
      )}
      <SectionTitle title={t('estados.balanceCapital')} />
      <HelpAccordion subtitle={t('estados.balanceCapitalSubtitle')} detail={t('estados.balanceCapitalDetail')} />
      <Row label={t('estados.balanceCapitalUtilidad')} value={balance.capital.utilidadDelPeriodo} testID="balance-capital-utilidad" />
      <Kpi label={t('estados.balanceCapitalTotal')} value={formatMoney(balance.capital.total)} tone={tone} align="right" testID="balance-capital-total" />
    </Card>
  );
}

function EmptyCard(props: { title: string; body: string }): ReactElement {
  return (
    <Card testID="balance-general-empty" padding="md" fullWidth>
      <Text fontFamily={typography.fontFamily} fontWeight={typography.weights.bold} fontSize={14} color={colors.ink}>{props.title}</Text>
      <Text fontFamily={typography.fontFamily} fontWeight={typography.weights.medium} fontSize={13} color={colors.gray600} marginTop={4}>{props.body}</Text>
    </Card>
  );
}

export function BalanceGeneralScreen(props: BalanceGeneralScreenProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View testID={props.testID ?? 'balance-general-screen'} gap={14}>
      <SectionTitle title={props.periodoLabel} />
      {props.balance === null ? (
        <EmptyCard title={t('estados.emptyPeriodTitle')} body={t('estados.emptyPeriodBody')} />
      ) : (
        <>
          <ResumenCard balance={props.balance} prior={props.priorBalance} t={t} />
          <View flexDirection="row" flexWrap="wrap" gap={14}>
            <View flex={1} minWidth={260}>
              <ActivoCard balance={props.balance} t={t} />
            </View>
            <View flex={1} minWidth={260}>
              <PasivoCapitalCard balance={props.balance} t={t} />
            </View>
          </View>
        </>
      )}
    </View>
  );
}
