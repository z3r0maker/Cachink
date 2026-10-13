/**
 * The right side of Cierre (Track M, M-09): the yellow «Efectivo esperado»
 * hero with its four parts, then the «Diferencia» — Cuadra (green), Falta
 * (red, Don worried) or Sobra (blue) — and, with a difference, the reason
 * chips and the note «Otra razón» asks for. Nothing counted yet says only
 * what to do next, never a red «Falta».
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';
import {
  DIF,
  type CierreData,
  type EstadoConteo,
  type MotivoDiferencia,
} from '@xangarro/caja/cierre';
import { desglose } from '@xangarro/caja/turno';
import { Don } from '../../components/Don/index';
import { MText } from '../../components/Mostrador/index';
import { Eyebrow, HeroPanel, QuietPanel } from '../../components/Panel/index';
import { borderWidths, radii } from '../../theme';
import { Explica } from './cierre-explica';

/** The difference's ground by kind; the tokens' soft/text pairs. */
const FONDO: Record<EstadoConteo['dif']['tipo'], string> = {
  cuadra: colors.greenSoft,
  falta: colors.redSoft,
  sobra: colors.blueSoft,
};

/** One of the four parts under the figure, signed and the gasto in red. */
function Parte(p: {
  readonly label: string;
  readonly value: string;
  readonly i: number;
}): ReactElement {
  return (
    <View
      flexDirection="row"
      alignItems="baseline"
      gap={10}
      paddingBottom={7}
      borderBottomWidth={borderWidths.thin}
      borderBottomColor={colors.yellowDeep}
    >
      <MText size="sm" weight="bold" flex={1}>
        {p.label}
      </MText>
      <MText
        size="body"
        weight="extraBold"
        fontVariant={['tabular-nums']}
        color={p.i === 3 ? colors.redText : colors.black}
      >
        {p.i === 1 || p.i === 2 ? `+${p.value}` : p.value}
      </MText>
    </View>
  );
}

/** «Efectivo esperado»: the figure and the four parts that formed it. */
export function CierreEsperado(p: {
  readonly e: EstadoConteo;
  readonly data: CierreData;
}): ReactElement {
  return (
    <HeroPanel label="Efectivo esperado" testID="cierre-esperado">
      <View gap={12}>
        <View gap={4}>
          <Eyebrow>Efectivo esperado</Eyebrow>
          <MText
            size="total"
            weight="extraBold"
            fontVariant={['tabular-nums']}
            letterSpacing={-1.4}
          >
            {formatMoney(p.e.esperado)}
          </MText>
        </View>
        <View gap={8}>
          {desglose(p.data.partes).map(([label, value], i) => (
            <Parte key={label} label={label} value={value} i={i} />
          ))}
        </View>
      </View>
    </HeroPanel>
  );
}

/** Nothing counted yet: no red «Falta», only what to do next. */
function SinContar(): ReactElement {
  return (
    <QuietPanel label="Diferencia" testID="cierre-diferencia" padding={16}>
      <MText size="sm" weight="semibold" color={colors.gray600}>
        Cuenta los billetes y las monedas de la caja. Aquí verás si cuadra con lo esperado.
      </MText>
    </QuietPanel>
  );
}

/** On a shortfall Don worries; otherwise the difference says one line. */
function Aviso(p: { readonly e: EstadoConteo }): ReactElement {
  if (p.e.dif.tipo !== 'falta') {
    return (
      <MText size="sm" weight="semibold" color={colors.gray600}>
        {DIF[p.e.dif.tipo].hint}
      </MText>
    );
  }
  return (
    <View flexDirection="row" alignItems="center" gap={8}>
      <Don pose="preocupado" size={72} />
      <View
        flex={1}
        minWidth={0}
        padding={12}
        borderRadius={radii[4]}
        borderWidth={borderWidths.thin}
        borderColor={colors.black}
        backgroundColor={colors.white}
      >
        <MText size="sm" weight="semibold">
          {DIF.falta.hint}
        </MText>
      </View>
    </View>
  );
}

/** The panel's first line: the word and the figure it names. */
function Cabeza(p: { readonly e: EstadoConteo }): ReactElement {
  const t = DIF[p.e.dif.tipo];
  return (
    <View flexDirection="row" alignItems="baseline" gap={10} flexWrap="wrap">
      <Eyebrow>Diferencia</Eyebrow>
      <MText size="body" weight="extraBold">
        {t.label}
      </MText>
      <MText
        size="xl4"
        weight="extraBold"
        fontVariant={['tabular-nums']}
        letterSpacing={-1}
        marginLeft="auto"
      >
        {formatMoney(p.e.dif.monto)}
      </MText>
    </View>
  );
}

/** Cuadra, Falta or Sobra; with a difference, the reason and its note. */
export function CierreDiferencia(p: {
  readonly e: EstadoConteo;
  readonly data: CierreData;
  readonly motivo: MotivoDiferencia | null;
  readonly onMotivo: (m: MotivoDiferencia) => void;
  readonly nota: string;
  readonly onNota: (t: string) => void;
}): ReactElement {
  if (p.e.contado === 0n) return <SinContar />;
  return (
    <View
      testID="cierre-diferencia"
      role="region"
      aria-label="Diferencia"
      gap={10}
      padding={16}
      borderRadius={radii[6]}
      borderWidth={borderWidths.thick}
      borderColor={colors.black}
      backgroundColor={FONDO[p.e.dif.tipo]}
    >
      <Cabeza e={p.e} />
      <Aviso e={p.e} />
      {p.e.dif.tipo === 'cuadra' ? null : (
        <Explica
          dueno={p.data.dueno}
          motivo={p.motivo}
          onMotivo={p.onMotivo}
          nota={p.nota}
          onNota={p.onNota}
        />
      )}
    </View>
  );
}
