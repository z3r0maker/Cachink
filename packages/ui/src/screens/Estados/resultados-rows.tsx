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

function RowWithHelp(p: RowProps & { subtitle: string; detail: string }): ReactElement {
  return (
    <>
      <Row label={p.label} value={p.value} emphasis={p.emphasis} testID={p.testID} />
      <HelpAccordion subtitle={p.subtitle} detail={p.detail} />
    </>
  );
}

function MermaRow({ estado, t }: { estado: EstadoDeResultados; t: T }): ReactElement | null {
  if (estado.merma <= ZERO) return null;
  return (
    <View>
      <Row label={t('estados.resultadosMerma')} value={estado.merma} testID="estado-row-merma" />
      <HelpAccordion
        subtitle={t('estados.resultadosMermaSubtitle')}
        detail={t('estados.resultadosMermaDetail')}
      />
    </View>
  );
}

function TopRows({ estado, t }: { estado: EstadoDeResultados; t: T }): ReactElement {
  return (
    <>
      <RowWithHelp
        label={t('estados.resultadosIngresos')}
        value={estado.ingresos}
        testID="estado-row-ingresos"
        subtitle={t('estados.resultadosIngresosSubtitle')}
        detail={t('estados.resultadosIngresosDetail')}
      />
      <RowWithHelp
        label={t('estados.resultadosCostoVentas')}
        value={estado.costoDeVentas}
        testID="estado-row-costo-ventas"
        subtitle={t('estados.resultadosCostoVentasSubtitle')}
        detail={t('estados.resultadosCostoVentasDetail')}
      />
      <RowWithHelp
        label={t('estados.resultadosUtilidadBruta')}
        value={estado.utilidadBruta}
        emphasis="total"
        testID="estado-row-utilidad-bruta"
        subtitle={t('estados.resultadosUtilidadBrutaSubtitle')}
        detail={t('estados.resultadosUtilidadBrutaDetail')}
      />
      <MermaRow estado={estado} t={t} />
    </>
  );
}

function IsrZeroHint({ estado, t }: { estado: EstadoDeResultados; t: T }): ReactElement | null {
  if (estado.isr !== ZERO || estado.utilidadOperativa >= ZERO) return null;
  return (
    <Text
      testID="estado-isr-zero-hint"
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.medium}
      fontSize={11}
      color={colors.gray400}
      paddingVertical={2}
    >
      {t('estados.isrZeroHint')}
    </Text>
  );
}

function BottomRows({ estado, t }: { estado: EstadoDeResultados; t: T }): ReactElement {
  return (
    <>
      <RowWithHelp
        label={t('estados.resultadosGastosOperativos')}
        value={estado.gastosOperativos}
        testID="estado-row-gastos-operativos"
        subtitle={t('estados.resultadosGastosOperativosSubtitle')}
        detail={t('estados.resultadosGastosOperativosDetail')}
      />
      <RowWithHelp
        label={t('estados.resultadosUtilidadOperativa')}
        value={estado.utilidadOperativa}
        emphasis="total"
        testID="estado-row-utilidad-operativa"
        subtitle={t('estados.resultadosUtilidadOperativaSubtitle')}
        detail={t('estados.resultadosUtilidadOperativaDetail')}
      />
      <RowWithHelp
        label={t('estados.resultadosIsr')}
        value={estado.isr}
        testID="estado-row-isr"
        subtitle={t('estados.resultadosIsrSubtitle')}
        detail={t('estados.resultadosIsrDetail')}
      />
      <IsrZeroHint estado={estado} t={t} />
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
