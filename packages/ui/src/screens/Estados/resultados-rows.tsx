/**
 * Rows — formal NIF B-3 breakdown card with HelpAccordions.
 *
 * Extracted from EstadoResultadosScreen to keep each file under 200 lines.
 * Includes the Merma row (shown only when merma > 0).
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { ZERO, formatMoney, type EstadoDeResultados, type Money } from '@cachink/domain';
import { Card, HelpAccordion } from '../../components/index';
import { colors, typography } from '../../theme';
import type { useTranslation } from '../../i18n/index';

type T = ReturnType<typeof useTranslation>['t'];

interface RowProps {
  readonly label: string;
  readonly value: Money;
  readonly emphasis?: 'normal' | 'total';
  readonly testID?: string;
}

function valueColor(value: Money, emphasis: 'normal' | 'total'): string {
  if (emphasis !== 'total') return colors.black;
  if (value < ZERO) return colors.red;
  if (value > ZERO) return colors.green;
  return colors.black;
}

function Row(props: RowProps): ReactElement {
  const emphasis = props.emphasis ?? 'normal';
  const weight = emphasis === 'total' ? typography.weights.black : typography.weights.medium;
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
        color={valueColor(props.value, emphasis)}
      >
        {formatMoney(props.value)}
      </Text>
    </View>
  );
}

function TopRows({ estado, t }: { estado: EstadoDeResultados; t: T }): ReactElement {
  return (
    <>
      <Row label={t('estados.resultadosIngresos')} value={estado.ingresos} testID="estado-row-ingresos" />
      <HelpAccordion subtitle={t('estados.resultadosIngresosSubtitle')} detail={t('estados.resultadosIngresosDetail')} />
      <Row label={t('estados.resultadosCostoVentas')} value={estado.costoDeVentas} testID="estado-row-costo-ventas" />
      <HelpAccordion subtitle={t('estados.resultadosCostoVentasSubtitle')} detail={t('estados.resultadosCostoVentasDetail')} />
      <Row label={t('estados.resultadosUtilidadBruta')} value={estado.utilidadBruta} emphasis="total" testID="estado-row-utilidad-bruta" />
      <HelpAccordion subtitle={t('estados.resultadosUtilidadBrutaSubtitle')} detail={t('estados.resultadosUtilidadBrutaDetail')} />
      {estado.merma > ZERO && (
        <View>
          <Row label={t('estados.resultadosMerma')} value={estado.merma} testID="estado-row-merma" />
          <HelpAccordion subtitle={t('estados.resultadosMermaSubtitle')} detail={t('estados.resultadosMermaDetail')} />
        </View>
      )}
    </>
  );
}

function BottomRows({ estado, t }: { estado: EstadoDeResultados; t: T }): ReactElement {
  return (
    <>
      <Row label={t('estados.resultadosGastosOperativos')} value={estado.gastosOperativos} testID="estado-row-gastos-operativos" />
      <HelpAccordion subtitle={t('estados.resultadosGastosOperativosSubtitle')} detail={t('estados.resultadosGastosOperativosDetail')} />
      <Row label={t('estados.resultadosUtilidadOperativa')} value={estado.utilidadOperativa} emphasis="total" testID="estado-row-utilidad-operativa" />
      <HelpAccordion subtitle={t('estados.resultadosUtilidadOperativaSubtitle')} detail={t('estados.resultadosUtilidadOperativaDetail')} />
      <Row label={t('estados.resultadosIsr')} value={estado.isr} testID="estado-row-isr" />
      <HelpAccordion subtitle={t('estados.resultadosIsrSubtitle')} detail={t('estados.resultadosIsrDetail')} />
      {estado.isr === ZERO && estado.utilidadOperativa < ZERO && (
        <Text testID="estado-isr-zero-hint" fontFamily={typography.fontFamily} fontWeight={typography.weights.medium} fontSize={11} color={colors.gray400} paddingVertical={2}>
          {t('estados.isrZeroHint')}
        </Text>
      )}
    </>
  );
}

export function ResultadosRows({ estado, t }: { estado: EstadoDeResultados; t: T }): ReactElement {
  return (
    <Card padding="md" fullWidth testID="estado-resultados-rows">
      <TopRows estado={estado} t={t} />
      <BottomRows estado={estado} t={t} />
    </Card>
  );
}
