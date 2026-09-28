/**
 * Pieces Fiado y abonos repeats on the list and on a client's detail
 * (MvCobranza): the tinted initials, the state chip, and the money in 800
 * tabular numerals.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { estado, type CuentaCliente } from '@xangarro/caja/cobranza';
import { MText, type MTextProps } from '../../components/Mostrador/index';
import { borderWidths, colors, shapeRadii } from '../../theme';
import { TONO_ESTADO } from './cobranza-logic';

/** A figure: 800 and tabular, so the amounts line up. */
export function Cifra(p: MTextProps): ReactElement {
  return <MText weight="extraBold" fontVariant={['tabular-nums']} {...p} />;
}

export function Avatar(p: { readonly c: CuentaCliente; readonly size: 44 | 52 }): ReactElement {
  return (
    <View
      width={p.size}
      height={p.size}
      flexShrink={0}
      alignItems="center"
      justifyContent="center"
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={p.c.tint}
      aria-hidden
    >
      <MText size={p.size === 52 ? 'lg' : 'md'} weight="extraBold">
        {p.c.iniciales}
      </MText>
    </View>
  );
}

/** «Atrasado», «Al día», «Sin saldo». */
export function EstadoChip({ c }: { readonly c: CuentaCliente }): ReactElement {
  const e = estado(c);
  const t = TONO_ESTADO[e];
  return (
    <View
      flexShrink={0}
      paddingHorizontal={8}
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.quiet}
      borderColor={t.borde}
      backgroundColor={t.fondo}
      testID={`estado-${c.id}`}
    >
      <MText size="xs" weight="extraBold" color={t.tinta}>
        {e}
      </MText>
    </View>
  );
}
