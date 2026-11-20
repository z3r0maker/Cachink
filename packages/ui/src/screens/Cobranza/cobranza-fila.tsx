/**
 * One client on Fiado y abonos (board RvFiado): the name and a line under it
 * («2 ventas abiertas», «Sin abonar hace 16 días»), the balance and its mark
 * («Abonó hoy», «Atrasado»). No buttons: the whole row opens the client.
 */
import type { ReactElement } from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { View } from '@tamagui/core';
import { renglonCuenta, saldo, type CuentaCliente } from '@xangarro/caja/cobranza';
import { formatMoney } from '@xangarro/domain';
import { MText } from '../../components/Mostrador/index';
import { borderColors, borderWidths, colors, radii } from '../../theme';

const estilo =
  (ultima: boolean) =>
  ({ pressed }: { pressed: boolean }): ViewStyle => ({
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderBottomWidth: ultima ? 0 : StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray100,
    backgroundColor: pressed ? colors.yellowSoft : colors.white,
  });

export function CobranzaFila(p: {
  readonly c: CuentaCliente;
  readonly hoy: string;
  readonly ultima: boolean;
  readonly onPress: () => void;
}): ReactElement {
  const f = renglonCuenta(p.c, p.hoy);
  const monto = formatMoney(saldo(p.c));
  return (
    <Pressable
      testID={`cobranza-cliente-${p.c.id}`}
      role="button"
      aria-label={[p.c.nombre, f.linea, monto, f.marca].filter(Boolean).join(', ')}
      onPress={p.onPress}
      style={estilo(p.ultima)}
    >
      <View flex={1} minWidth={0} gap={2} alignItems="flex-start">
        <MText size="body" weight="extraBold" numberOfLines={1}>
          {p.c.nombre}
        </MText>
        <MText size="sm" weight="semibold" color={colors.gray600} numberOfLines={1}>
          {f.linea}
        </MText>
      </View>
      <View alignItems="flex-end" gap={2}>
        <MText size="body" weight="extraBold" fontVariant={['tabular-nums']}>
          {monto}
        </MText>
        {f.marca ? (
          <MText size="xs" weight="bold" color={colors.gray600}>
            {f.marca}
          </MText>
        ) : null}
      </View>
    </Pressable>
  );
}

/** The rows on one quiet panel, as the board draws them. */
export function CobranzaFilas(p: {
  readonly cuentas: readonly CuentaCliente[];
  readonly hoy: string;
  readonly onAbrir: (id: string) => void;
}): ReactElement {
  return (
    <View
      testID="cobranza-filas"
      backgroundColor={colors.white}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      borderRadius={radii[6]}
      overflow="hidden"
    >
      {p.cuentas.map((c, i) => (
        <CobranzaFila
          key={c.id}
          c={c}
          hoy={p.hoy}
          ultima={i === p.cuentas.length - 1}
          onPress={() => p.onAbrir(c.id)}
        />
      ))}
    </View>
  );
}
