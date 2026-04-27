/**
 * BalanceGeneralScreen — NIF B-6 (P1C-M8-T03, Slice 3 C13).
 *
 * Two-column layout on desktop (Activo | Pasivo+Capital), stacked
 * vertically on narrow screens. Kpi totals sit at the bottom so the
 * Activo-total ≈ Pasivo+Capital identity is immediately visible.
 *
 * Pure presentation.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { formatMoney, type BalanceGeneral, type Money } from '@cachink/domain';
import { Card, Kpi, SectionTitle, Tag } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export interface BalanceGeneralScreenProps {
  readonly balance: BalanceGeneral | null;
  readonly periodoLabel: string;
  readonly testID?: string;
}

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
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={13}
        color={colors.ink}
      >
        {props.label}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={14}
        color={colors.black}
      >
        {formatMoney(props.value)}
      </Text>
    </View>
  );
}

function ActivoCard({
  balance,
  t,
}: {
  balance: BalanceGeneral;
  t: ReturnType<typeof useTranslation>['t'];
}): ReactElement {
  return (
    <Card testID="balance-activo-card" padding="md" fullWidth>
      <SectionTitle title={t('estados.balanceActivo')} />
      <Row
        label={t('estados.balanceActivoEfectivo')}
        value={balance.activo.efectivo}
        testID="balance-activo-efectivo"
      />
      <Row
        label={t('estados.balanceActivoInventarios')}
        value={balance.activo.inventarios}
        testID="balance-activo-inventarios"
      />
      <Row
        label={t('estados.balanceActivoCxC')}
        value={balance.activo.cuentasPorCobrar}
        testID="balance-activo-cxc"
      />
      <Kpi
        label={t('estados.balanceActivoTotal')}
        value={formatMoney(balance.activo.total)}
        testID="balance-activo-total"
      />
    </Card>
  );
}

function PasivoCapitalCard({
  balance,
  t,
}: {
  balance: BalanceGeneral;
  t: ReturnType<typeof useTranslation>['t'];
}): ReactElement {
  const tone: 'positive' | 'negative' | 'neutral' =
    balance.capital.utilidadDelPeriodo >= 0n ? 'positive' : 'negative';
  return (
    <Card testID="balance-pasivo-capital-card" padding="md" fullWidth>
      <SectionTitle title={t('estados.balancePasivo')} />
      {balance.pasivo.total === 0n ? (
        <View paddingVertical={6} testID="balance-pasivo-empty">
          <Tag variant="neutral">{t('estados.balancePasivoCero')}</Tag>
        </View>
      ) : (
        <Row
          label={t('estados.balancePasivoTotal')}
          value={balance.pasivo.total}
          testID="balance-pasivo-total"
        />
      )}
      <SectionTitle title={t('estados.balanceCapital')} />
      <Row
        label={t('estados.balanceCapitalUtilidad')}
        value={balance.capital.utilidadDelPeriodo}
        testID="balance-capital-utilidad"
      />
      <Kpi
        label={t('estados.balanceCapitalTotal')}
        value={formatMoney(balance.capital.total)}
        tone={tone}
        testID="balance-capital-total"
      />
    </Card>
  );
}

function EmptyCard(props: { title: string; body: string }): ReactElement {
  return (
    <Card testID="balance-general-empty" padding="md" fullWidth>
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

export function BalanceGeneralScreen(props: BalanceGeneralScreenProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View testID={props.testID ?? 'balance-general-screen'} gap={14}>
      <SectionTitle title={props.periodoLabel} />
      {props.balance === null ? (
        <EmptyCard title={t('estados.emptyPeriodTitle')} body={t('estados.emptyPeriodBody')} />
      ) : (
        <View flexDirection="row" flexWrap="wrap" gap={14}>
          <View flex={1} minWidth={260}>
            <ActivoCard balance={props.balance} t={t} />
          </View>
          <View flex={1} minWidth={260}>
            <PasivoCapitalCard balance={props.balance} t={t} />
          </View>
        </View>
      )}
    </View>
  );
}
