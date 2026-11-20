/**
 * Efectivo on the cobro (board MvCobroTotal): what the customer hands over,
 * typed on the keypad or tapped as «Exacto» and the round bills, beside the
 * change (green) or what is still missing (red). Both stay smaller than the
 * total above them; the keypad takes the height that is left.
 */
import type { ReactElement, ReactNode } from 'react';
import { Pressable } from 'react-native';
import { View } from '@tamagui/core';
import { formatMoney, type Money } from '@xangarro/domain';
import { Eyebrow } from '../../components/Panel/index';
import { MText } from '../../components/Mostrador/index';
import { borderColors, borderWidths, colors, radii } from '../../theme';
import { billetes, comoTecleado, type EstadoEfectivo, type Tecla } from './cobro-logic';
import type { MedidasCobro } from './cobro-medidas';
import { TecladoCobro } from './cobro-teclado';

export interface CobroEfectivoProps {
  readonly total: Money;
  readonly tecleado: string;
  readonly estado: EstadoEfectivo;
  readonly medidas: MedidasCobro;
  readonly onTecla: (k: Tecla) => void;
  readonly onMonto: (tecleado: string) => void;
}

/** «$1,234.5» while typing, so a half-typed amount reads as typed. */
function mostrado(tecleado: string): string {
  if (tecleado === '') return '$0.00';
  const [ent = '0', dec] = tecleado.split('.');
  const miles = Number(ent || '0').toLocaleString('es-MX');
  return `$${miles}${dec === undefined ? '' : `.${dec}`}`;
}

function Rapidos(p: CobroEfectivoProps): ReactElement {
  return (
    <View flexDirection="row" gap={6}>
      {billetes(p.total).map((v, i) => {
        const on = p.tecleado === comoTecleado(v);
        const label = v === p.total ? 'Exacto' : formatMoney(v).replace('.00', '');
        return (
          <Pressable
            key={String(v)}
            testID={`cobro-rapido-${i}`}
            role="button"
            aria-label={v === p.total ? `Exacto, ${formatMoney(v)}` : `Paga con ${label}`}
            onPress={() => p.onMonto(comoTecleado(v))}
            style={{
              flex: 1,
              height: p.medidas.rapido,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radii[2],
              borderWidth: borderWidths.thin,
              borderColor: colors.black,
              backgroundColor: on ? colors.black : colors.white,
            }}
          >
            <MText size="body" weight="extraBold" color={on ? colors.yellow : colors.black}>
              {label}
            </MText>
          </Pressable>
        );
      })}
    </View>
  );
}

interface Tono {
  readonly tinta: string;
  readonly fondo: string;
  readonly borde: string;
  readonly label: string;
  readonly monto: string;
}

/** Gray until something is typed, then green with the change or red with what is missing. */
function tonoDe(d: Money | null): Tono {
  if (d === null) {
    const base = { tinta: colors.gray600, fondo: colors.gray100, borde: borderColors.quiet };
    return { ...base, label: 'Su cambio', monto: '$0.00' };
  }
  if (d < 0n) {
    const rojo = { tinta: colors.redText, fondo: colors.redSoft, borde: colors.redText };
    return { ...rojo, label: 'Todavía falta', monto: formatMoney(-d) };
  }
  const verde = { tinta: colors.greenText, fondo: colors.greenSoft, borde: colors.greenText };
  return { ...verde, label: d === 0n ? 'Pagó exacto' : 'Su cambio', monto: formatMoney(d) };
}

function Celda(p: {
  readonly fondo: string;
  readonly borde: string;
  readonly ancho: number;
  readonly testID?: string;
  readonly vivo?: boolean;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <View
      testID={p.testID}
      aria-live={p.vivo ? 'polite' : undefined}
      flex={1}
      minWidth={0}
      justifyContent="center"
      paddingHorizontal={10}
      paddingVertical={4}
      borderRadius={radii[2]}
      borderWidth={p.ancho}
      borderColor={p.borde}
      backgroundColor={p.fondo}
    >
      {p.children}
    </View>
  );
}

function Cifra(p: {
  readonly size: MedidasCobro['cifraCuenta'];
  readonly color: string;
  readonly testID?: string;
  readonly children: string;
}): ReactElement {
  return (
    <MText
      testID={p.testID}
      size={p.size}
      weight="extraBold"
      color={p.color}
      letterSpacing={-0.4}
      numberOfLines={1}
      adjustsFontSizeToFit
      maxFontSizeMultiplier={1.2}
      fontVariant={['tabular-nums']}
    >
      {p.children}
    </MText>
  );
}

function Cuenta(p: CobroEfectivoProps): ReactElement {
  const t = tonoDe(p.estado.diferencia);
  const { cuenta, cifraCuenta } = p.medidas;
  return (
    <View flexDirection="row" gap={8} minHeight={cuenta}>
      <Celda fondo={colors.white} borde={colors.black} ancho={borderWidths.thin} vivo>
        <Eyebrow color={colors.gray600}>Paga con</Eyebrow>
        <Cifra size={cifraCuenta} color={colors.black} testID="cobro-recibido">
          {mostrado(p.tecleado)}
        </Cifra>
      </Celda>
      <Celda fondo={t.fondo} borde={t.borde} ancho={borderWidths.quiet} testID="cobro-cambio" vivo>
        <Eyebrow color={t.tinta}>{t.label}</Eyebrow>
        <Cifra size={cifraCuenta} color={t.tinta}>
          {t.monto}
        </Cifra>
      </Celda>
    </View>
  );
}

export function CobroEfectivo(p: CobroEfectivoProps): ReactElement {
  return (
    <View flex={1} gap={p.medidas.separacion} testID="cobro-efectivo">
      <Cuenta {...p} />
      <Rapidos {...p} />
      <TecladoCobro separacion={p.medidas.separacionTeclas} onTecla={p.onTecla} />
    </View>
  );
}
