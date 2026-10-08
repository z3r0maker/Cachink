/**
 * The latest abonos on a client's account (MvCobranza, «Abonos»): method and
 * day, where each one landed (`historial`, oldest ticket first) or what the
 * operator wrote, and the amount.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { historial, type CuentaCliente } from '@xangarro/caja/cobranza';
import { formatMoney } from '@xangarro/domain';
import { Eyebrow, GLYPHS, MText, PathIcon } from '../../components/index';
import { borderWidths, colors, shapeRadii } from '../../theme';
import { FILA } from './cliente-partes';
import { Cifra } from './cobranza-partes';

const PUNTO = {
  width: 28,
  height: 28,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: shapeRadii.pill,
  borderWidth: borderWidths.quiet,
  borderColor: colors.greenText,
  backgroundColor: colors.greenSoft,
} as const;

/** The three latest abonos; each says where it landed (`historial`). */
export function Abonos({ c }: { readonly c: CuentaCliente }): ReactElement {
  const donde = new Map(historial(c).map((m) => [`${m.fecha}|${m.monto}`, m.detalle]));
  const ultimos = [...c.abonos].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 3);
  return (
    <View gap={6} role="list" aria-label="Abonos" testID="cliente-abonos">
      <Eyebrow>Abonos</Eyebrow>
      {ultimos.length === 0 ? (
        <MText textAlign="left" size="md" weight="semibold" color={colors.gray600}>
          Todavía no ha abonado.
        </MText>
      ) : null}
      {ultimos.map((a) => (
        <View key={a.id} role="listitem" {...FILA}>
          <View style={PUNTO}>
            <PathIcon d={GLYPHS.check} size={14} color={colors.greenText} strokeWidth={2.6} />
          </View>
          <View flex={1} minWidth={0}>
            <MText textAlign="left" size="md" weight="bold">{`${a.metodo} · ${a.dia}`}</MText>
            <MText
              textAlign="left"
              size="xs"
              weight="semibold"
              color={colors.textMuted}
              numberOfLines={2}
            >
              {a.nota ?? donde.get(`${a.fecha}|${a.monto}`) ?? ''}
            </MText>
          </View>
          <Cifra size="body" color={colors.greenText}>
            {formatMoney(a.monto)}
          </Cifra>
        </View>
      ))}
    </View>
  );
}
