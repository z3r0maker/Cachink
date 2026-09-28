/**
 * One client on Fiado y abonos (MvCobranza): initials, name and balance, the
 * state chip and how old the debt is («Abonó hoy · debe desde hace 16
 * días»). The whole row opens the account.
 */
import type { ReactElement } from 'react';
import { Pressable, type ViewStyle } from 'react-native';
import { View } from '@tamagui/core';
import { lineaCuenta, saldo, type CuentaCliente } from '@xangarro/caja/cobranza';
import { formatMoney } from '@xangarro/domain';
import { MText } from '../../components/Mostrador/index';
import { GLYPHS, PathIcon } from '../../components/PathIcon/index';
import { colors } from '../../theme';
import { colorSaldo } from './cobranza-logic';
import { Avatar, Cifra, EstadoChip } from './cobranza-partes';

const estilo =
  (ultima: boolean) =>
  ({ pressed }: { pressed: boolean }): ViewStyle => ({
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: ultima ? 0 : 1,
    borderBottomColor: colors.gray100,
    backgroundColor: pressed ? colors.offwhite : colors.white,
  });

function Texto(p: { c: CuentaCliente; hoy: string }): ReactElement {
  const s = saldo(p.c);
  return (
    <View flex={1} minWidth={0} gap={4}>
      <View flexDirection="row" alignItems="baseline" gap={8}>
        <MText
          textAlign="left"
          size="body"
          weight="extraBold"
          numberOfLines={1}
          flex={1}
          minWidth={0}
        >
          {p.c.nombre}
        </MText>
        <Cifra size="lgx" color={colorSaldo(s)}>
          {formatMoney(s)}
        </Cifra>
      </View>
      <View flexDirection="row" alignItems="center" gap={6} minWidth={0}>
        <EstadoChip c={p.c} />
        <MText
          textAlign="left"
          size="sm"
          weight="semibold"
          color={colors.gray600}
          numberOfLines={1}
          flex={1}
        >
          {lineaCuenta(p.c, p.hoy)}
        </MText>
      </View>
    </View>
  );
}

export function CobranzaFila(p: {
  readonly c: CuentaCliente;
  readonly hoy: string;
  readonly ultima: boolean;
  readonly onPress: () => void;
}): ReactElement {
  return (
    <Pressable
      testID={`cobranza-cliente-${p.c.id}`}
      role="button"
      aria-label={`Ver cuenta de ${p.c.nombre}, debe ${formatMoney(saldo(p.c))}`}
      onPress={p.onPress}
      style={estilo(p.ultima)}
    >
      <Avatar c={p.c} size={44} />
      <Texto c={p.c} hoy={p.hoy} />
      <PathIcon d={GLYPHS.chevronRight} size={18} color={colors.gray600} />
    </Pressable>
  );
}
