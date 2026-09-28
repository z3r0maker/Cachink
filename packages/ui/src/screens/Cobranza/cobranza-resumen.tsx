/**
 * The top of Fiado y abonos (MvCobranza): the three figures (por cobrar,
 * today's abonos, of them in cash) from the caja's `resumen`, and the search
 * by name or phone.
 */
import type { ReactElement } from 'react';
import { TextInput } from 'react-native';
import { View } from '@tamagui/core';
import { resumen, type CuentaCliente } from '@xangarro/caja/cobranza';
import { formatMoney, type Money } from '@xangarro/domain';
import { MText, PathIcon } from '../../components/index';
import {
  borderColors,
  borderWidths,
  colors,
  portalFontSizes,
  radii,
  typography,
} from '../../theme';
import { COBRAR_GLYPHS } from '../Ventas/cobrar-glyphs';
import { Cifra } from './cobranza-partes';

function Figura(p: { label: string; monto: Money; color: string; borde: boolean }): ReactElement {
  return (
    <View
      flex={1}
      minWidth={0}
      paddingHorizontal={10}
      gap={1}
      borderRightWidth={p.borde ? borderWidths.quiet : 0}
      borderRightColor={borderColors.quiet}
    >
      <MText size="xs" weight="bold" color={colors.gray600}>
        {p.label}
      </MText>
      <Cifra size="lgx" color={p.color} numberOfLines={1} adjustsFontSizeToFit>
        {formatMoney(p.monto)}
      </Cifra>
    </View>
  );
}

export function Resumen(p: { cuentas: readonly CuentaCliente[]; hoy: string }): ReactElement {
  const { cuentas, hoy } = p;
  const r = resumen(cuentas, hoy);
  return (
    <View
      role="region"
      aria-label="Resumen de fiado"
      testID="cobranza-resumen"
      flexDirection="row"
      paddingVertical={10}
      borderRadius={radii[6]}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      backgroundColor={colors.white}
    >
      <Figura label="Por cobrar" monto={r.porCobrar} color={colors.warningText} borde />
      <Figura label="Abonos hoy" monto={r.abonado} color={colors.greenText} borde />
      <Figura label="En efectivo" monto={r.efectivo} color={colors.black} borde={false} />
    </View>
  );
}

export function Buscador(p: { q: string; onQ: (q: string) => void }): ReactElement {
  return (
    <View
      flexDirection="row"
      alignItems="center"
      gap={10}
      height={48}
      paddingHorizontal={14}
      borderRadius={radii[3]}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={colors.white}
    >
      <PathIcon d={COBRAR_GLYPHS.buscar} size={18} color={colors.gray600} />
      <TextInput
        testID="cobranza-buscar"
        aria-label="Buscar cliente"
        placeholder="Busca por nombre o teléfono"
        placeholderTextColor={colors.textMuted}
        value={p.q}
        onChangeText={p.onQ}
        style={{
          flex: 1,
          height: 44,
          fontFamily: typography.fontFamily,
          fontWeight: '600',
          fontSize: portalFontSizes.body,
          color: colors.black,
        }}
      />
    </View>
  );
}
