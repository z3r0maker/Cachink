/**
 * FlujoEfectivoScreen — NIF B-2 Flujo de Efectivo.
 *
 * Restructured with punchline-first ResumenCard, collapsible
 * sub-component detail rows, 4-bar DivergingBar, and HelpAccordions.
 *
 * Pure presentation.
 */

import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { formatMoney, type FlujoDeEfectivo, ZERO } from '@cachink/domain';
import { HelpAccordion, Kpi, SectionTitle } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { DivergingBar } from '../../charts/DivergingBar/index';
import { moneyToNumber } from '../../charts/chart-tokens';
import { CollapsibleSection, EmptyCard, ResumenCard, SubRow, type T } from './flujo-components';

export interface FlujoEfectivoScreenProps {
  readonly flujo: FlujoDeEfectivo | null;
  readonly periodoLabel: string;
  readonly priorFlujo?: FlujoDeEfectivo | null;
  readonly testID?: string;
}

function OperacionSection({ flujo, t }: { flujo: FlujoDeEfectivo; t: T }): ReactElement {
  return (
    <CollapsibleSection
      label={t('estados.flujoOperacion')}
      total={flujo.operacion}
      testID="flujo-operacion"
    >
      <>
        <HelpAccordion
          subtitle={t('estados.flujoOperacionSubtitle')}
          detail={t('estados.flujoOperacionDetail')}
        />
        <SubRow
          label={t('estados.flujoCobrosContado')}
          value={flujo.cobroVentasContado}
          testID="flujo-cobros-contado"
        />
        <SubRow
          label={t('estados.flujoCobrosCredito')}
          value={flujo.cobroCreditoClientes}
          testID="flujo-cobros-credito"
        />
        <SubRow
          label={t('estados.flujoGastosOp')}
          value={ZERO - flujo.egresoOperativo}
          testID="flujo-gastos-op"
        />
      </>
    </CollapsibleSection>
  );
}

function InversionSection({ flujo, t }: { flujo: FlujoDeEfectivo; t: T }): ReactElement {
  return (
    <CollapsibleSection
      label={t('estados.flujoInversion')}
      total={flujo.inversion}
      testID="flujo-inversion"
    >
      <>
        <HelpAccordion
          subtitle={t('estados.flujoInversionSubtitle')}
          detail={t('estados.flujoInversionDetail')}
        />
        <SubRow
          label={t('estados.flujoComprasInv')}
          value={ZERO - flujo.egresoInversion}
          testID="flujo-compras-inv"
        />
      </>
    </CollapsibleSection>
  );
}

function FlujoDivergingBar({ flujo, t }: { flujo: FlujoDeEfectivo; t: T }): ReactElement {
  return (
    <DivergingBar
      items={[
        { label: t('estados.flujoCobrosContado'), value: moneyToNumber(flujo.cobroVentasContado) },
        {
          label: t('estados.flujoCobrosCredito'),
          value: moneyToNumber(flujo.cobroCreditoClientes),
        },
        { label: t('estados.flujoGastosOp'), value: -moneyToNumber(flujo.egresoOperativo) },
        { label: t('estados.flujoComprasInv'), value: -moneyToNumber(flujo.egresoInversion) },
      ]}
      testID="flujo-diverging-bar"
    />
  );
}

function FlujoBody({
  flujo,
  priorFlujo,
  t,
}: {
  flujo: FlujoDeEfectivo;
  priorFlujo?: FlujoDeEfectivo | null;
  t: T;
}): ReactElement {
  return (
    <View gap={12}>
      <ResumenCard flujo={flujo} prior={priorFlujo} t={t} />
      <OperacionSection flujo={flujo} t={t} />
      <InversionSection flujo={flujo} t={t} />
      <FlujoDivergingBar flujo={flujo} t={t} />
      <Kpi
        label={t('estados.flujoTotal')}
        value={formatMoney(flujo.total)}
        tone={flujo.total >= 0n ? 'positive' : 'negative'}
        align="right"
        testID="flujo-total"
      />
    </View>
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
