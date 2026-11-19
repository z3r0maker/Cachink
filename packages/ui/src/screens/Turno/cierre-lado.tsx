/**
 * Cierre, step 2's figures (M-16, MvCierreFlujo): the result card — Contaste,
 * Esperado and the difference, tinted Cuadra (green), Falta (red) or Sobra
 * (blue) — and «Cómo se calculó lo esperado», the four parts that formed it.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';
import { DIF, type CierreData, type EstadoConteo } from '@xangarro/caja/cierre';
import { desgloseFirmado } from '@xangarro/caja/turno';
import { MText } from '../../components/Mostrador/index';
import { QuietPanel } from '../../components/Panel/index';
import { borderWidths, radii } from '../../theme';

/** The result's ground by kind; the tokens' soft pairs. */
const FONDO: Record<EstadoConteo['dif']['tipo'], string> = {
  cuadra: colors.greenSoft,
  falta: colors.redSoft,
  sobra: colors.blueSoft,
};

function Renglon(p: { readonly k: string; readonly v: string; readonly testID: string }) {
  return (
    <View flexDirection="row" alignItems="center" minHeight={30}>
      <MText size="body" weight="bold" flex={1}>
        {p.k}
      </MText>
      <MText size="lgx" weight="extraBold" fontVariant={['tabular-nums']} testID={p.testID}>
        {p.v}
      </MText>
    </View>
  );
}

/** Contaste, Esperado and what the difference is. */
export function CierreResultado(p: { readonly e: EstadoConteo }): ReactElement {
  const tipo = p.e.dif.tipo;
  return (
    <View
      testID="cierre-diferencia"
      role="region"
      aria-label="Resultado"
      gap={6}
      paddingHorizontal={16}
      paddingVertical={14}
      borderRadius={radii[6]}
      borderWidth={borderWidths.thick}
      borderColor={colors.black}
      backgroundColor={FONDO[tipo]}
    >
      <Renglon k="Contaste" v={formatMoney(p.e.contado)} testID="cierre-resultado-contado" />
      <Renglon k="Esperado" v={formatMoney(p.e.esperado)} testID="cierre-esperado" />
      <View
        flexDirection="row"
        alignItems="baseline"
        paddingTop={8}
        borderTopWidth={borderWidths.thin}
        borderTopColor={colors.black}
      >
        <MText size="lgx" weight="extraBold" flex={1}>
          {tipo === 'cuadra' ? 'Diferencia' : DIF[tipo].label}
        </MText>
        <MText size="xl4" weight="extraBold" fontVariant={['tabular-nums']} letterSpacing={-0.8}>
          {formatMoney(p.e.dif.monto)}
        </MText>
      </View>
    </View>
  );
}

/** «Cómo se calculó lo esperado»: the fondo, the two inflows and the gastos. */
export function CierreDesglose(p: { readonly data: CierreData }): ReactElement {
  return (
    <QuietPanel label="Cómo se calculó lo esperado" testID="cierre-desglose" padding={14}>
      <View gap={2}>
        {desgloseFirmado(p.data.partes).map((f) => (
          <View key={f.label} flexDirection="row" alignItems="center" minHeight={32}>
            <MText size="md" weight="semibold" flex={1}>
              {f.label}
            </MText>
            <MText
              size="md"
              weight="extraBold"
              fontVariant={['tabular-nums']}
              color={f.resta ? colors.redText : colors.black}
            >
              {f.valor}
            </MText>
          </View>
        ))}
      </View>
    </QuietPanel>
  );
}
