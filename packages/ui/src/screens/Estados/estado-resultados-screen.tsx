/**
 * EstadoResultadosScreen — NIF B-3 Estado de Resultados (P1C-M8-T02,
 * Slice 3 C11).
 *
 * Seven lines per CLAUDE.md §10:
 *   Ingresos − Costo de Ventas = Utilidad Bruta
 *   Utilidad Bruta − Gastos Operativos = Utilidad Operativa
 *   Utilidad Operativa − ISR = Utilidad Neta  (hero KPI, green/red by sign)
 *
 * Pure presentation. Parent wires `useEstadoResultados(periodo)`.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { ZERO, formatMoney, type EstadoDeResultados, type Money } from '@cachink/domain';
import { Card, Kpi, SectionTitle } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export interface EstadoResultadosScreenProps {
  readonly estado: EstadoDeResultados | null;
  readonly periodoLabel: string;
  readonly loading?: boolean;
  readonly testID?: string;
}

interface RowProps {
  readonly label: string;
  readonly value: Money;
  readonly emphasis?: 'normal' | 'total';
  readonly testID?: string;
}

function Row(props: RowProps): ReactElement {
  const weight = props.emphasis === 'total' ? typography.weights.black : typography.weights.medium;
  return (
    <View
      testID={props.testID}
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      paddingVertical={8}
    >
      <Text fontFamily={typography.fontFamily} fontWeight={weight} fontSize={14} color={colors.ink}>
        {props.label}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={weight}
        fontSize={16}
        color={colors.black}
      >
        {formatMoney(props.value)}
      </Text>
    </View>
  );
}

function UtilidadNetaHero(props: { value: Money; label: string }): ReactElement {
  const tone = props.value >= ZERO ? 'positive' : 'negative';
  return (
    <Kpi
      value={formatMoney(props.value)}
      label={props.label}
      tone={tone}
      testID="estado-utilidad-neta-hero"
    />
  );
}

function EmptyBody(props: { title: string; body: string }): ReactElement {
  return (
    <Card testID="estado-resultados-empty" padding="md" fullWidth>
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

function Rows({
  estado,
  t,
}: {
  estado: EstadoDeResultados;
  t: ReturnType<typeof useTranslation>['t'];
}): ReactElement {
  return (
    <Card padding="md" fullWidth testID="estado-resultados-rows">
      <Row
        label={t('estados.resultadosIngresos')}
        value={estado.ingresos}
        testID="estado-row-ingresos"
      />
      <Row
        label={t('estados.resultadosCostoVentas')}
        value={estado.costoDeVentas}
        testID="estado-row-costo-ventas"
      />
      <Row
        label={t('estados.resultadosUtilidadBruta')}
        value={estado.utilidadBruta}
        emphasis="total"
        testID="estado-row-utilidad-bruta"
      />
      <Row
        label={t('estados.resultadosGastosOperativos')}
        value={estado.gastosOperativos}
        testID="estado-row-gastos-operativos"
      />
      <Row
        label={t('estados.resultadosUtilidadOperativa')}
        value={estado.utilidadOperativa}
        emphasis="total"
        testID="estado-row-utilidad-operativa"
      />
      <Row label={t('estados.resultadosIsr')} value={estado.isr} testID="estado-row-isr" />
    </Card>
  );
}

export function EstadoResultadosScreen(props: EstadoResultadosScreenProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View testID={props.testID ?? 'estado-resultados-screen'} gap={14}>
      <SectionTitle title={props.periodoLabel} />
      {props.estado === null ? (
        <EmptyBody title={t('estados.emptyPeriodTitle')} body={t('estados.emptyPeriodBody')} />
      ) : (
        <>
          <Rows estado={props.estado} t={t} />
          <UtilidadNetaHero
            value={props.estado.utilidadNeta}
            label={t('estados.resultadosUtilidadNeta')}
          />
        </>
      )}
    </View>
  );
}
