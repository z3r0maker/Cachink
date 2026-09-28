/**
 * The pieces of «Anótalo a su cuenta» (MvFiado): a client as a radio row
 * with what they owe (and, chosen, what they would owe), and «Cliente nuevo»
 * with its name and phone.
 */
import type { ReactElement } from 'react';
import { Pressable, TextInput } from 'react-native';
import { View } from '@tamagui/core';
import { formatMoney, type Money } from '@xangarro/domain';
import { mayuscula } from '@xangarro/caja';
import type { ClienteFiado } from '@xangarro/caja/caja';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import {
  borderColors,
  borderWidths,
  colors,
  portalFontSizes,
  radii,
  shadows,
  shapeRadii,
  typography,
} from '../../theme';
import { COBRAR_GLYPHS } from '../Ventas/cobrar-glyphs';

const elegido = (on: boolean) =>
  on
    ? {
        backgroundColor: colors.yellowSoft,
        borderWidth: borderWidths.thick,
        borderColor: colors.black,
        boxShadow: shadows.small,
      }
    : {
        backgroundColor: colors.white,
        borderWidth: borderWidths.quiet,
        borderColor: borderColors.quiet,
      };

function Punto({ on }: { on: boolean }): ReactElement {
  return (
    <View
      width={22}
      height={22}
      alignItems="center"
      justifyContent="center"
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={colors.white}
      aria-hidden
    >
      {on ? (
        <View
          width={10}
          height={10}
          borderRadius={shapeRadii.pill}
          backgroundColor={colors.black}
        />
      ) : null}
    </View>
  );
}

const RADIO = {
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: 12,
  padding: 14,
  borderRadius: radii[4],
} as const;

export function ClienteRadio(p: {
  k: ClienteFiado;
  total: Money;
  on: boolean;
  onPick: () => void;
}): ReactElement {
  const debe = p.k.saldo > 0n;
  const saldo = debe ? `Debe ${formatMoney(p.k.saldo)}` : 'Sin saldo';
  return (
    <Pressable
      testID={`fiado-cliente-${p.k.id}`}
      role="radio"
      aria-checked={p.on}
      aria-label={`${p.k.nombre}, ${saldo}`}
      onPress={p.onPick}
      style={{ ...RADIO, ...elegido(p.on) }}
    >
      <Punto on={p.on} />
      <View flex={1} gap={2} alignItems="flex-start">
        <MText size="body" weight="extraBold">
          {p.k.nombre}
        </MText>
        <MText size="md" weight="bold" color={debe ? colors.warningText : colors.textMuted}>
          {saldo}
        </MText>
        {p.on ? (
          <MText
            size="md"
            weight="extraBold"
          >{`Quedaría debiendo ${formatMoney(p.k.saldo + p.total)}`}</MText>
        ) : null}
      </View>
    </Pressable>
  );
}

const CAMPO = {
  height: 48,
  paddingHorizontal: 14,
  borderRadius: radii[3],
  borderWidth: borderWidths.thin,
  borderColor: colors.black,
  backgroundColor: colors.white,
  fontFamily: typography.fontFamily,
  fontWeight: '700',
  fontSize: portalFontSizes.body,
  color: colors.black,
} as const;

export interface NuevoCliente {
  readonly nombre: string;
  readonly telefono: string;
}

function Campos(p: {
  v: NuevoCliente;
  onCambio: (v: NuevoCliente) => void;
  dueno: string;
}): ReactElement {
  const { v } = p;
  return (
    <View gap={10}>
      <TextInput
        testID="fiado-nuevo-nombre"
        aria-label="Nombre"
        placeholder="Don Beto del puesto"
        placeholderTextColor={colors.textMuted}
        value={v.nombre}
        onChangeText={(nombre) => p.onCambio({ ...v, nombre })}
        style={CAMPO}
      />
      <TextInput
        testID="fiado-nuevo-telefono"
        aria-label="Teléfono (opcional)"
        placeholder="Teléfono (opcional)"
        placeholderTextColor={colors.textMuted}
        inputMode="tel"
        value={v.telefono}
        onChangeText={(t) => p.onCambio({ ...v, telefono: t.replace(/[^0-9 ]/g, '') })}
        style={CAMPO}
      />
      <MText size="sm" weight="semibold" color={colors.gray600}>
        {`${mayuscula(p.dueno)} lo revisa en su portal.`}
      </MText>
    </View>
  );
}

const VACIO: NuevoCliente = { nombre: '', telefono: '' };

export function ClienteNuevo(p: {
  valor: NuevoCliente | null;
  onCambio: (v: NuevoCliente | null) => void;
  dueno: string;
}): ReactElement {
  const abierto = p.valor !== null;
  return (
    <View padding={14} gap={12} borderRadius={radii[4]} style={elegido(abierto)}>
      <Pressable
        testID="fiado-nuevo"
        role="button"
        aria-expanded={abierto}
        onPress={() => p.onCambio(abierto ? null : VACIO)}
        style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10 }}
      >
        <PathIcon d={COBRAR_GLYPHS.mas} size={18} strokeWidth={2.6} />
        <MText size="body" weight="extraBold">
          Cliente nuevo
        </MText>
      </Pressable>
      {p.valor !== null ? <Campos v={p.valor} onCambio={p.onCambio} dueno={p.dueno} /> : null}
    </View>
  );
}
