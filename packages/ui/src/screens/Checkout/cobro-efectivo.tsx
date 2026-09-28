/**
 * «¿Con cuánto paga?» (MvCobro, Efectivo): what the customer hands over,
 * typed on the keypad or tapped as «Exacto» and the round bills, and the
 * change (green) or what is still missing (red), big.
 */
import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { View } from '@tamagui/core';
import { formatMoney, type Money } from '@xangarro/domain';
import { Eyebrow } from '../../components/Panel/index';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import { borderColors, borderWidths, colors, radii } from '../../theme';
import { COBRAR_GLYPHS } from '../Ventas/cobrar-glyphs';
import { billetes, comoTecleado, TECLAS, type EstadoEfectivo, type Tecla } from './cobro-logic';

export interface CobroEfectivoProps {
  readonly total: Money;
  readonly tecleado: string;
  readonly estado: EstadoEfectivo;
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
    <View flexDirection="row" gap={8}>
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
              height: 48,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radii[2],
              borderWidth: borderWidths.thin,
              borderColor: colors.black,
              backgroundColor: on ? colors.black : colors.white,
            }}
          >
            <MText size="md" weight="extraBold" color={on ? colors.yellow : colors.black}>
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
  readonly nota: string | null;
  readonly monto: string;
}

/** Gray until something is typed, then green with the change or red with what is missing. */
function tonoDe(d: Money | null): Tono {
  if (d === null) {
    const base = { tinta: colors.gray600, fondo: colors.gray100, borde: borderColors.quiet };
    return { ...base, label: 'Su cambio', nota: null, monto: '$0.00' };
  }
  if (d < 0n) {
    const rojo = { tinta: colors.redText, fondo: colors.redSoft, borde: colors.redText };
    return { ...rojo, label: 'Todavía falta', nota: 'Pídele el resto.', monto: formatMoney(-d) };
  }
  const nota = d === 0n ? 'Pagó exacto.' : 'Cuéntalo frente al cliente.';
  const verde = { tinta: colors.greenText, fondo: colors.greenSoft, borde: colors.greenText };
  return { ...verde, label: 'Su cambio', nota, monto: formatMoney(d) };
}

function Cambio({ e }: { e: EstadoEfectivo }): ReactElement {
  const t = tonoDe(e.diferencia);
  return (
    <View
      testID="cobro-cambio"
      aria-live="polite"
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      padding={14}
      borderRadius={radii[4]}
      borderWidth={borderWidths.thin}
      borderColor={t.borde}
      backgroundColor={t.fondo}
    >
      <View>
        <Eyebrow color={t.tinta}>{t.label}</Eyebrow>
        {t.nota ? (
          <MText size="sm" weight="bold" color={t.tinta}>
            {t.nota}
          </MText>
        ) : null}
      </View>
      <MText size="total" weight="extraBold" color={t.tinta}>
        {t.monto}
      </MText>
    </View>
  );
}

function Teclado({ onTecla }: { onTecla: (k: Tecla) => void }): ReactElement {
  return (
    <View role="group" aria-label="Teclado de números" flexDirection="row" flexWrap="wrap" gap={8}>
      {TECLAS.map((k) => (
        <Pressable
          key={k}
          testID={`cobro-tecla-${k}`}
          role="button"
          aria-label={k === 'borrar' ? 'Borrar' : k === '.' ? 'Punto' : k}
          onPress={() => onTecla(k)}
          style={({ pressed }) => ({
            width: '31.5%',
            height: 56,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: radii[3],
            borderWidth: borderWidths.quiet,
            borderColor: borderColors.quiet,
            backgroundColor: pressed ? colors.gray200 : colors.white,
          })}
        >
          {k === 'borrar' ? (
            <PathIcon d={COBRAR_GLYPHS.borrar} size={22} />
          ) : (
            <MText size="xl3" weight="extraBold">
              {k}
            </MText>
          )}
        </Pressable>
      ))}
    </View>
  );
}

export function CobroEfectivo(p: CobroEfectivoProps): ReactElement {
  return (
    <View gap={12} testID="cobro-efectivo">
      <View flexDirection="row" alignItems="center" justifyContent="space-between">
        <Eyebrow>¿Con cuánto paga?</Eyebrow>
        <MText size="xl6" weight="extraBold" aria-live="polite" testID="cobro-recibido">
          {mostrado(p.tecleado)}
        </MText>
      </View>
      <Rapidos {...p} />
      <Cambio e={p.estado} />
      <Teclado onTecla={p.onTecla} />
    </View>
  );
}
