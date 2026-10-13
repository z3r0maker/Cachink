/**
 * The sale sheet's body pieces (MvVentas detalle): the estado pill, one line
 * of what it carried with its tinted glyph, the four tiles and the notes a
 * cancelled or fiado sale adds. Pure display over `@xangarro/caja/ventas`.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import { PRODUCT_ICONS } from '@xangarro/caja';
import { iconoPorNombre, TINT } from '@xangarro/caja/caja';
import { fichas, type LineaDetalle, type VentaDetalle } from '@xangarro/caja/ventas';
import { Btn } from '../../components/Btn/index';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import { borderWidths, colors, radii, shapeRadii } from '../../theme';

export function Pill({ texto, bg, fg }: { texto: string; bg: string; fg: string }): ReactElement {
  return (
    <View
      flexDirection="row"
      alignItems="center"
      gap={6}
      borderWidth={borderWidths.thin}
      borderColor={fg}
      backgroundColor={bg}
      borderRadius={shapeRadii.pill}
      paddingHorizontal={10}
      paddingVertical={4}
      testID="venta-detalle-estado"
    >
      <View width={9} height={9} borderRadius={shapeRadii.pill} backgroundColor={fg} />
      <MText size="xs" weight="bold" color={fg}>
        {texto}
      </MText>
    </View>
  );
}

export function Linea({ l }: { readonly l: LineaDetalle }): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" gap={10} paddingVertical={8}>
      <View
        width={34}
        height={34}
        alignItems="center"
        justifyContent="center"
        borderRadius={radii[1]}
        borderWidth={borderWidths.thin}
        borderColor={colors.black}
        backgroundColor={TINT[l.categoria]}
      >
        <PathIcon
          d={PRODUCT_ICONS[iconoPorNombre(l.nombre)][0] ?? ''}
          size={18}
          strokeWidth={2.2}
        />
      </View>
      <View flex={1} alignItems="flex-start">
        <MText size="md" weight="bold" textAlign="left">
          {l.nombre}
        </MText>
        <MText size="xs" weight="semibold" color={colors.gray600} textAlign="left">
          {l.precio === undefined
            ? l.cantidad === 1
              ? '1 pieza'
              : `${l.cantidad} piezas`
            : `${l.cantidad} × ${formatMoney(l.precio)}`}
        </MText>
      </View>
      {l.precio === undefined ? null : (
        <MText size="md" weight="extraBold" style={{ fontVariant: ['tabular-nums'] }}>
          {formatMoney(l.precio * BigInt(l.cantidad))}
        </MText>
      )}
    </View>
  );
}

export function FichaTiles(p: {
  readonly venta: VentaDetalle;
  readonly ctx: { readonly operador: string; readonly caja: string; readonly desde: string };
}): ReactElement {
  return (
    <View flexDirection="row" flexWrap="wrap" gap={8} testID="venta-detalle-fichas">
      {fichas(p.venta, p.ctx).map((f) => (
        <View
          key={f.k}
          flexBasis="48%"
          flexGrow={1}
          padding={10}
          gap={2}
          borderRadius={radii[3]}
          borderWidth={borderWidths.quiet}
          borderColor={colors.gray200}
          backgroundColor={colors.gray100}
          alignItems="flex-start"
        >
          <MText size="xs" weight="extraBold" color={colors.gray600} textAlign="left">
            {f.k}
          </MText>
          <MText size="md" weight="bold" color={f.color ?? colors.black} textAlign="left">
            {f.v}
          </MText>
        </View>
      ))}
    </View>
  );
}

/** The red note of a cancelled sale; the amber one of a fiado sale. */
export function Nota(p: {
  readonly venta: VentaDetalle;
  readonly onAbono?: () => void;
}): ReactElement | null {
  if (p.venta.cancelada) {
    return (
      <View
        padding={12}
        borderRadius={radii[3]}
        backgroundColor={colors.redSoft}
        testID="venta-detalle-nota"
      >
        <MText size="sm" weight="bold" color={colors.redText}>
          {`Se canceló por: ${p.venta.cancelada.motivo}. Ya no cuenta en tus ventas ni en tu corte.`}
        </MText>
      </View>
    );
  }
  if (!p.venta.fiado) return null;
  return (
    <View
      padding={12}
      borderRadius={radii[3]}
      backgroundColor={colors.warningSoft}
      gap={10}
      testID="venta-detalle-nota"
    >
      <MText size="sm" weight="bold">
        {`Esta venta se fue a la cuenta de ${p.venta.fiado.cliente}. No entró dinero a tu caja.`}
      </MText>
      {p.onAbono ? (
        <Btn variant="secondary" onPress={p.onAbono} testID="venta-detalle-abono">
          Recibir un abono
        </Btn>
      ) : null}
    </View>
  );
}
