/**
 * The pieces of «Recibir abono» (MvCobranza's sheet): the amount as typed
 * with the quick amounts (`rapidos`: all of it, then $500 and $200 under
 * it), how the client pays, where it lands with the new balance, and the
 * number keys.
 */
import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { View } from '@tamagui/core';
import { rapidos, type MetodoAbono } from '@xangarro/caja/cobranza';
import { formatMoney, type Money } from '@xangarro/domain';
import { Chip, MText, PathIcon } from '../../components/index';
import { borderColors, borderWidths, colors, radii } from '../../theme';
import { comoTecleado, TECLAS, type Tecla } from '../Checkout/cobro-logic';
import { COBRAR_GLYPHS } from '../Ventas/cobrar-glyphs';
import { montoTecleado, type EstadoAbono } from './cobranza-logic';
import { Cifra } from './cobranza-partes';

function Rapido(p: { v: Money; total: Money; on: boolean; onPress: () => void }): ReactElement {
  const label = p.v === p.total ? `Todo · ${formatMoney(p.v)}` : formatMoney(p.v);
  return (
    <Pressable
      testID={`abono-rapido-${String(p.v)}`}
      role="button"
      aria-label={p.v === p.total ? `Todo lo que debe, ${formatMoney(p.v)}` : label}
      onPress={p.onPress}
      style={{
        height: 44,
        paddingHorizontal: 14,
        justifyContent: 'center',
        borderRadius: radii[3],
        borderWidth: borderWidths.thin,
        borderColor: colors.black,
        backgroundColor: p.on ? colors.black : colors.white,
      }}
    >
      <Cifra size="md" color={p.on ? colors.yellow : colors.black}>
        {label}
      </Cifra>
    </Pressable>
  );
}

function Pantalla({ tecleado }: { tecleado: string }): ReactElement {
  return (
    <View
      role="status"
      aria-label={`Cuánto abona: $${montoTecleado(tecleado)}`}
      flexDirection="row"
      alignItems="center"
      gap={6}
      height={60}
      paddingHorizontal={16}
      borderRadius={radii[4]}
      borderWidth={borderWidths.thick}
      borderColor={colors.black}
      backgroundColor={colors.white}
    >
      <Cifra size="xl5" color={colors.textMuted}>
        $
      </Cifra>
      <Cifra
        size="xl6"
        color={tecleado === '' ? colors.gray400 : colors.black}
        testID="abono-monto"
        numberOfLines={1}
        adjustsFontSizeToFit
        flex={1}
      >
        {montoTecleado(tecleado)}
      </Cifra>
    </View>
  );
}

export function Monto(p: {
  tecleado: string;
  saldo: Money;
  onMonto: (tecleado: string) => void;
}): ReactElement {
  return (
    <View gap={8}>
      <MText size="md" weight="extraBold">
        Cuánto abona
      </MText>
      <Pantalla tecleado={p.tecleado} />
      <View flexDirection="row" flexWrap="wrap" gap={8}>
        {rapidos(p.saldo).map((v) => (
          <Rapido
            key={String(v)}
            v={v}
            total={p.saldo}
            on={p.tecleado === comoTecleado(v)}
            onPress={() => p.onMonto(comoTecleado(v))}
          />
        ))}
      </View>
    </View>
  );
}

/** The boards' order; the same three the web takes (`METODOS_ABONO`). */
const METODOS: readonly MetodoAbono[] = ['Efectivo', 'Tarjeta', 'Transferencia'];

export function Metodo(p: {
  value: MetodoAbono;
  onChange: (m: MetodoAbono) => void;
}): ReactElement {
  return (
    <View role="radiogroup" aria-label="Cómo paga" gap={6}>
      <MText size="md" weight="extraBold">
        Cómo paga
      </MText>
      <View flexDirection="row" flexWrap="wrap" gap={8}>
        {METODOS.map((m) => (
          <Chip
            key={m}
            label={m}
            selected={p.value === m}
            onPress={() => p.onChange(m)}
            testID={`abono-metodo-${m}`}
          />
        ))}
      </View>
    </View>
  );
}

export function SeAplica({ e }: { e: EstadoAbono }): ReactElement {
  return (
    <View
      aria-live="polite"
      gap={4}
      paddingVertical={10}
      paddingHorizontal={12}
      borderRadius={radii[3]}
      borderWidth={borderWidths.quiet}
      borderColor={colors.warningText}
      backgroundColor={colors.warningSoft}
    >
      <MText size="sm" weight="semibold" testID="abono-aplica">
        <MText size="sm" weight="extraBold">
          Se aplica a:{' '}
        </MText>
        {e.aplica}
      </MText>
      <View flexDirection="row" alignItems="baseline" justifyContent="space-between">
        <MText size="sm" weight="bold" color={colors.gray600}>
          Nuevo saldo
        </MText>
        <Cifra size="cardTitle" color={colors.warningText} testID="abono-restante">
          {formatMoney(e.restante)}
        </Cifra>
      </View>
    </View>
  );
}

export function Teclas({ onTecla }: { onTecla: (k: Tecla) => void }): ReactElement {
  return (
    <View role="group" aria-label="Teclado de números" flexDirection="row" flexWrap="wrap" gap={6}>
      {TECLAS.map((k) => (
        <Pressable
          key={k}
          testID={`abono-tecla-${k}`}
          role="button"
          aria-label={k === 'borrar' ? 'Borrar' : k === '.' ? 'Punto' : k}
          onPress={() => onTecla(k)}
          style={({ pressed }) => ({
            width: '32%',
            height: 48,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: radii[3],
            borderWidth: borderWidths.quiet,
            borderColor: borderColors.quiet,
            backgroundColor: pressed ? colors.gray200 : colors.offwhite,
          })}
        >
          {k === 'borrar' ? (
            <PathIcon d={COBRAR_GLYPHS.borrar} size={22} />
          ) : (
            <Cifra size="xl2">{k}</Cifra>
          )}
        </Pressable>
      ))}
    </View>
  );
}
