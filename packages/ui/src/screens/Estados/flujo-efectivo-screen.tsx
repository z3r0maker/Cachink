/**
 * FlujoEfectivoScreen — NIF B-2 Flujo de Efectivo.
 *
 * Restructured with punchline-first ResumenCard, collapsible
 * sub-component detail rows, 4-bar DivergingBar, and HelpAccordions.
 *
 * Pure presentation.
 */

import { useState, type ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { formatMoney, type FlujoDeEfectivo, type Money, ZERO } from '@cachink/domain';
import {
  Card,
  DeltaIndicator,
  HelpAccordion,
  HealthIndicator,
  Kpi,
  SectionTitle,
} from '../../components/index';
import { Icon } from '../../components/Icon/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';
import { DivergingBar } from '../../charts/DivergingBar/index';
import { moneyToNumber } from '../../charts/chart-tokens';

export interface FlujoEfectivoScreenProps {
  readonly flujo: FlujoDeEfectivo | null;
  readonly periodoLabel: string;
  readonly priorFlujo?: FlujoDeEfectivo | null;
  readonly testID?: string;
}

type T = ReturnType<typeof useTranslation>['t'];

function SubRow(props: { label: string; value: Money; testID: string }): ReactElement {
  return (
    <View testID={props.testID} flexDirection="row" justifyContent="space-between" alignItems="center" paddingVertical={4} paddingLeft={16}>
      <Text fontFamily={typography.fontFamily} fontWeight={typography.weights.medium} fontSize={12} color={colors.gray600}>{props.label}</Text>
      <Text fontFamily={typography.fontFamily} fontWeight={typography.weights.bold} fontSize={13} color={colors.black}>{formatMoney(props.value)}</Text>
    </View>
  );
}

function CollapsibleSection(props: {
  label: string;
  total: Money;
  children: ReactElement;
  testID: string;
}): ReactElement {
  const [open, setOpen] = useState(false);
  return (
    <Card padding="md" fullWidth testID={props.testID}>
      <View flexDirection="row" justifyContent="space-between" alignItems="center" onPress={() => setOpen((p) => !p)} cursor="pointer">
        <View flexDirection="row" alignItems="center" gap={6}>
          <Icon name={open ? 'chevron-down' : 'chevron-right'} size={16} color={colors.gray600} />
          <Text fontFamily={typography.fontFamily} fontWeight={typography.weights.bold} fontSize={14} color={colors.ink}>{props.label}</Text>
        </View>
        <Text fontFamily={typography.fontFamily} fontWeight={typography.weights.black} fontSize={18} color={props.total >= 0n ? colors.black : colors.red}>{formatMoney(props.total)}</Text>
      </View>
      {open && <View marginTop={8}>{props.children}</View>}
    </Card>
  );
}

function ResumenCard({ flujo, prior, t }: { flujo: FlujoDeEfectivo; prior?: FlujoDeEfectivo | null; t: T }): ReactElement {
  const tone = flujo.total >= ZERO ? 'healthy' : 'critical';
  const verdict = flujo.total >= ZERO ? t('estados.flujoResumenPositive') : t('estados.flujoResumenNegative');
  return (
    <Card testID="flujo-resumen-card" padding="md" fullWidth>
      <SectionTitle title={t('estados.resultadosResumenTitle')} />
      <Text fontFamily={typography.fontFamily} fontWeight={typography.weights.medium} fontSize={14} color={colors.ink} marginTop={4} marginBottom={8}>
        {t('estados.flujoResumenSentence', { total: formatMoney(flujo.total) })}
      </Text>
      <HealthIndicator tone={tone} verdict={verdict} testID="flujo-resumen-health" />
      {prior !== undefined && prior !== null && (
        <DeltaIndicator
          current={moneyToNumber(flujo.total)}
          previous={moneyToNumber(prior.total)}
          format="percent"
          periodLabel={t('estados.deltaVsMesAnterior')}
          testID="flujo-resumen-delta"
        />
      )}
    </Card>
  );
}

function EmptyCard(props: { title: string; body: string }): ReactElement {
  return (
    <Card testID="flujo-efectivo-empty" padding="md" fullWidth>
      <Text fontFamily={typography.fontFamily} fontWeight={typography.weights.bold} fontSize={14} color={colors.ink}>{props.title}</Text>
      <Text fontFamily={typography.fontFamily} fontWeight={typography.weights.medium} fontSize={13} color={colors.gray600} marginTop={4}>{props.body}</Text>
    </Card>
  );
}

function FlujoBody(props: { flujo: FlujoDeEfectivo; priorFlujo?: FlujoDeEfectivo | null; t: T }): ReactElement {
  const { flujo, t } = props;
  return (
    <View gap={12}>
      <ResumenCard flujo={flujo} prior={props.priorFlujo} t={t} />
      <CollapsibleSection label={t('estados.flujoOperacion')} total={flujo.operacion} testID="flujo-operacion">
        <>
          <HelpAccordion subtitle={t('estados.flujoOperacionSubtitle')} detail={t('estados.flujoOperacionDetail')} />
          <SubRow label={t('estados.flujoCobrosContado')} value={flujo.cobroVentasContado} testID="flujo-cobros-contado" />
          <SubRow label={t('estados.flujoCobrosCredito')} value={flujo.cobroCreditoClientes} testID="flujo-cobros-credito" />
          <SubRow label={t('estados.flujoGastosOp')} value={ZERO - flujo.egresoOperativo} testID="flujo-gastos-op" />
        </>
      </CollapsibleSection>
      <CollapsibleSection label={t('estados.flujoInversion')} total={flujo.inversion} testID="flujo-inversion">
        <>
          <HelpAccordion subtitle={t('estados.flujoInversionSubtitle')} detail={t('estados.flujoInversionDetail')} />
          <SubRow label={t('estados.flujoComprasInv')} value={ZERO - flujo.egresoInversion} testID="flujo-compras-inv" />
        </>
      </CollapsibleSection>
      <FlujoDivergingBar flujo={flujo} t={t} />
      <Kpi label={t('estados.flujoTotal')} value={formatMoney(flujo.total)} tone={flujo.total >= 0n ? 'positive' : 'negative'} align="right" testID="flujo-total" />
    </View>
  );
}

function FlujoDivergingBar(props: { flujo: FlujoDeEfectivo; t: T }): ReactElement {
  const { flujo, t } = props;
  return (
    <DivergingBar
      items={[
        { label: t('estados.flujoCobrosContado'), value: moneyToNumber(flujo.cobroVentasContado) },
        { label: t('estados.flujoCobrosCredito'), value: moneyToNumber(flujo.cobroCreditoClientes) },
        { label: t('estados.flujoGastosOp'), value: -moneyToNumber(flujo.egresoOperativo) },
        { label: t('estados.flujoComprasInv'), value: -moneyToNumber(flujo.egresoInversion) },
      ]}
      testID="flujo-diverging-bar"
    />
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
        <FlujoBody flujo={props.flujo} priorFlujo={props.priorFlujo} t={t} />
      )}
    </View>
  );
}
