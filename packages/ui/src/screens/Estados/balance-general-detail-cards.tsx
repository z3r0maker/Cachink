/**
 * Activo and Pasivo/Capital cards for the Balance General screen (NIF B-6).
 *
 * Separated from `balance-general-cards.tsx` so both files stay inside the
 * §2.6 200-line budget; these two are the long, row-heavy ones.
 */

import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { formatMoney, type BalanceGeneral, type Money } from '@cachink/domain';
import { Card, HelpAccordion, Kpi, SectionTitle, Tag } from '../../components/index';
import type { useTranslation } from '../../i18n/index';
import { colors } from '../../theme';
import { StackedBar } from '../../charts/StackedBar/index';
import { formatChartLabel, moneyToNumber } from '../../charts/chart-tokens';
import { Row } from './balance-general-cards';

type T = ReturnType<typeof useTranslation>['t'];

/** A balance line with its explanatory accordion — the pattern both cards repeat. */
function ExplainedRow(props: {
  label: string;
  value: Money;
  subtitle: string;
  detail: string;
  testID: string;
}): ReactElement {
  return (
    <>
      <Row label={props.label} value={props.value} testID={props.testID} />
      <HelpAccordion subtitle={props.subtitle} detail={props.detail} />
    </>
  );
}

/** How the assets divide between cash, stock and receivables. */
function ActivoComposition({ balance, t }: { balance: BalanceGeneral; t: T }): ReactElement {
  return (
    <StackedBar
      segments={[
        {
          label: t('estados.balanceActivoEfectivo'),
          value: moneyToNumber(balance.activo.efectivo),
          color: colors.green,
        },
        {
          label: t('estados.balanceActivoInventarios'),
          value: moneyToNumber(balance.activo.inventarios),
          color: colors.blue,
        },
        {
          label: t('estados.balanceActivoCxC'),
          value: moneyToNumber(balance.activo.cuentasPorCobrar),
          color: colors.warning,
        },
      ]}
      formatValue={formatChartLabel}
      testID="balance-activo-bar"
    />
  );
}

export function ActivoCard({ balance, t }: { balance: BalanceGeneral; t: T }): ReactElement {
  return (
    <Card testID="balance-activo-card" padding="md" fullWidth>
      <SectionTitle title={t('estados.balanceActivo')} />
      <ExplainedRow
        label={t('estados.balanceActivoEfectivo')}
        value={balance.activo.efectivo}
        subtitle={t('estados.balanceActivoEfectivoSubtitle')}
        detail={t('estados.balanceActivoEfectivoDetail')}
        testID="balance-activo-efectivo"
      />
      <ExplainedRow
        label={t('estados.balanceActivoInventarios')}
        value={balance.activo.inventarios}
        subtitle={t('estados.balanceActivoInventariosSubtitle')}
        detail={t('estados.balanceActivoInventariosDetail')}
        testID="balance-activo-inventarios"
      />
      <ExplainedRow
        label={t('estados.balanceActivoCxC')}
        value={balance.activo.cuentasPorCobrar}
        subtitle={t('estados.balanceActivoCxCSubtitle')}
        detail={t('estados.balanceActivoCxCDetail')}
        testID="balance-activo-cxc"
      />
      <ActivoComposition balance={balance} t={t} />
      <Kpi
        label={t('estados.balanceActivoTotal')}
        value={formatMoney(balance.activo.total)}
        align="right"
        testID="balance-activo-total"
      />
    </Card>
  );
}

/** Liabilities, which read "none" rather than "0" when the business owes nothing. */
function PasivoSection({ balance, t }: { balance: BalanceGeneral; t: T }): ReactElement {
  return (
    <>
      <SectionTitle title={t('estados.balancePasivo')} />
      <HelpAccordion
        subtitle={t('estados.balancePasivoSubtitle')}
        detail={t('estados.balancePasivoDetail')}
      />
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
    </>
  );
}

export function PasivoCapitalCard({ balance, t }: { balance: BalanceGeneral; t: T }): ReactElement {
  const tone: 'positive' | 'negative' | 'neutral' =
    balance.capital.utilidadDelPeriodo >= 0n ? 'positive' : 'negative';
  return (
    <Card testID="balance-pasivo-capital-card" padding="md" fullWidth>
      <PasivoSection balance={balance} t={t} />
      <SectionTitle title={t('estados.balanceCapital')} />
      <HelpAccordion
        subtitle={t('estados.balanceCapitalSubtitle')}
        detail={t('estados.balanceCapitalDetail')}
      />
      <Row
        label={t('estados.balanceCapitalUtilidad')}
        value={balance.capital.utilidadDelPeriodo}
        testID="balance-capital-utilidad"
      />
      <Kpi
        label={t('estados.balanceCapitalTotal')}
        value={formatMoney(balance.capital.total)}
        tone={tone}
        align="right"
        testID="balance-capital-total"
      />
    </Card>
  );
}
