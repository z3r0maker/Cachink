/**
 * One client in the «Fiado y abonos» list (MvCobranzaLista): avatar with the
 * account's tint, the state chip, the balance in the debt's tone, how old the
 * debt is, and the card's two actions — «Recibir abono» while they owe, and
 * «Ver cuenta» always. A client who owes nothing shows «Sin saldo por cobrar»
 * where the abono would go (the web's card, translated).
 */
import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import {
  estado,
  resumenCliente,
  saldo,
  type CuentaCliente,
  type EstadoCliente,
} from '@xangarro/caja/cobranza';
import { MText } from '../../components/Mostrador/index';
import { Eyebrow } from '../../components/Panel/index';
import { PathIcon } from '../../components/PathIcon/index';
import { GLYPHS } from '../../components/PathIcon/glyphs';
import { borderColors, borderWidths, colors, radii, shadows, shapeRadii } from '../../theme';

const TONO: Record<EstadoCliente, { bg: string; tinta: string }> = {
  'Al día': { bg: colors.gray100, tinta: colors.gray600 },
  Atrasado: { bg: colors.warningSoft, tinta: colors.warningText },
  'Sin saldo': { bg: colors.greenSoft, tinta: colors.greenText },
};

/** The state chip: «Atrasado» on warning, «Al día» quiet, «Sin saldo» green. */
export function EstadoChip({
  x,
  testID,
}: {
  readonly x: CuentaCliente;
  readonly testID?: string;
}): ReactElement {
  const e = estado(x);
  const tono = TONO[e];
  return (
    <View
      testID={testID}
      backgroundColor={tono.bg}
      borderRadius={shapeRadii.pill}
      paddingHorizontal={10}
      paddingVertical={4}
    >
      <MText size="tag" weight="extraBold" color={tono.tinta}>
        {e}
      </MText>
    </View>
  );
}

function Avatar({ x }: { readonly x: CuentaCliente }): ReactElement {
  return (
    <View
      width={44}
      height={44}
      alignItems="center"
      justifyContent="center"
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={x.tint}
      aria-hidden
    >
      <MText size="sm" weight="extraBold">
        {x.iniciales}
      </MText>
    </View>
  );
}

function Accion(p: {
  readonly label: string;
  readonly amarilla: boolean;
  readonly testID: string;
  readonly onPress: () => void;
}): ReactElement {
  return (
    <Pressable
      testID={p.testID}
      role="button"
      accessibilityLabel={p.label}
      onPress={p.onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radii[2],
        borderWidth: borderWidths.thin,
        borderColor: p.amarilla ? colors.black : borderColors.quiet,
        backgroundColor: p.amarilla ? colors.yellow : colors.white,
        boxShadow: pressed ? shadows.pressed : p.amarilla ? shadows.small : undefined,
        transform: pressed ? [{ translateX: 2 }, { translateY: 2 }] : [],
      })}
    >
      <MText size="sm" weight="extraBold">
        {p.label}
      </MText>
    </Pressable>
  );
}

function Quien({ x }: { readonly x: CuentaCliente }): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" gap={10}>
      <Avatar x={x} />
      <View flex={1} minWidth={0} gap={2} alignItems="flex-start">
        <MText size="body" weight="extraBold" numberOfLines={1}>
          {x.nombre}
        </MText>
        <MText size="sm" weight="semibold" color={colors.gray600}>
          {x.telefono}
        </MText>
      </View>
      <EstadoChip x={x} />
    </View>
  );
}

function SaldoRow({ x }: { readonly x: CuentaCliente }): ReactElement {
  const debe = saldo(x) > 0n;
  return (
    <View flexDirection="row" alignItems="baseline" justifyContent="space-between">
      <Eyebrow>Saldo</Eyebrow>
      <MText size="xl4" weight="extraBold" color={debe ? colors.warningText : colors.black}>
        {formatMoney(saldo(x))}
      </MText>
    </View>
  );
}

function VerCuenta({ x, onVer }: { readonly x: CuentaCliente; onVer: () => void }): ReactElement {
  return (
    <Pressable
      testID={`cobranza-ver-${x.id}`}
      role="button"
      aria-label={`Ver cuenta de ${x.nombre}`}
      onPress={onVer}
      style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
    >
      <PathIcon d={GLYPHS.chevronRight} size={18} color={colors.gray600} />
    </Pressable>
  );
}

export interface CuentaTarjetaProps {
  readonly x: CuentaCliente;
  readonly onAbonar: () => void;
  readonly onVer: () => void;
}

/** The card: who, their state, the balance, the age of the debt, the actions. */
export function CuentaTarjeta(p: CuentaTarjetaProps): ReactElement {
  return (
    <View
      testID={`cobranza-cliente-${p.x.id}`}
      backgroundColor={colors.white}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      borderRadius={radii[6]}
      padding={14}
      gap={12}
    >
      <Quien x={p.x} />
      <SaldoRow x={p.x} />
      <MText size="sm" weight="semibold" color={colors.gray600}>
        {resumenCliente(p.x)}
      </MText>
      <Botones {...p} />
    </View>
  );
}

function Botones(p: CuentaTarjetaProps): ReactElement {
  if (saldo(p.x) <= 0n) {
    return (
      <View flexDirection="row" gap={8} alignItems="center">
        <MText size="sm" weight="semibold" color={colors.textMuted} flex={1}>
          Sin saldo por cobrar
        </MText>
        <VerCuenta x={p.x} onVer={p.onVer} />
      </View>
    );
  }
  return (
    <View flexDirection="row" gap={8} alignItems="center">
      <Accion
        label="Recibir abono"
        amarilla
        testID={`cobranza-abonar-${p.x.id}`}
        onPress={p.onAbonar}
      />
      <Accion
        label="Ver cuenta"
        amarilla={false}
        testID={`cobranza-ver-${p.x.id}`}
        onPress={p.onVer}
      />
    </View>
  );
}
