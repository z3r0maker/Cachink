/**
 * «Ver de dónde sale» (MvTurno): the expected cash's four parts, signed the
 * way the board reads them, and «Debe haber» under the black rule. Folded
 * inside the hero until asked for.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import { desgloseFirmado, notaFondo, type TurnoData } from '@xangarro/caja/turno';
import { MText } from '../../components/Mostrador/index';
import { borderWidths, colors } from '../../theme';

function Parte(p: {
  readonly label: string;
  readonly nota?: string;
  readonly valor: string;
  readonly resta: boolean;
  readonly ultima: boolean;
}): ReactElement {
  return (
    <View
      minHeight={40}
      flexDirection="row"
      alignItems="center"
      gap={6}
      borderTopWidth={borderWidths.thin}
      borderTopColor={colors.yellowDeep}
      borderBottomWidth={p.ultima ? borderWidths.thin : 0}
      borderBottomColor={colors.black}
    >
      <MText size="md" weight="bold" color={colors.ink}>
        {p.label}
      </MText>
      {p.nota ? (
        <MText size="xs" weight="bold" color={colors.ink} flexShrink={1} numberOfLines={1}>
          {p.nota}
        </MText>
      ) : null}
      <MText
        size="body"
        weight="extraBold"
        marginLeft="auto"
        fontVariant={['tabular-nums']}
        color={p.resta ? colors.redText : colors.black}
      >
        {p.valor}
      </MText>
    </View>
  );
}

export function MiTurnoDesglose(p: { readonly data: TurnoData }): ReactElement {
  const d = p.data;
  const partes = desgloseFirmado(d).map((x, i) =>
    i === 0 ? { ...x, nota: notaFondo(d.titular) } : x,
  );
  return (
    <View testID="turno-desglose">
      {partes.map((x, i) => (
        <Parte key={x.label} {...x} ultima={i === partes.length - 1} />
      ))}
      <View minHeight={44} flexDirection="row" alignItems="center">
        <MText size="md" weight="extraBold">
          Debe haber
        </MText>
        <MText
          size="sectionTitle"
          weight="extraBold"
          marginLeft="auto"
          fontVariant={['tabular-nums']}
          testID="turno-desglose-total"
        >
          {formatMoney(d.esperado)}
        </MText>
      </View>
    </View>
  );
}
