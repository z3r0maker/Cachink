/**
 * The fields of «¿Qué pasó con la mercancía?» (RvInventario's sheet): the
 * product with its stock, and what happened to a merma. The kinds of move
 * are in `mover-tipos.tsx`, the quantity in `mover-cantidad.tsx`.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import {
  conUnidad,
  MOTIVOS_MERMA,
  type Existencia,
  type MotivoMerma,
} from '@xangarro/caja/inventario';
import { Chip, MText, PathIcon } from '../../components/index';
import { borderColors, borderWidths, colors, radii, shapeRadii } from '../../theme';
import { COBRAR_GLYPHS } from '../Ventas/cobrar-glyphs';
import { ProductoTile } from './mover-glifos';
import { EstadoChip } from './inventario-filas';

/** «Del escáner» (EcInventario): the escáner chose the product, so only the quantity is left. */
function DelEscaner(): ReactElement {
  return (
    <View
      testID="mover-del-escaner"
      flexDirection="row"
      alignItems="center"
      gap={6}
      paddingHorizontal={10}
      paddingVertical={3}
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      backgroundColor={colors.gray100}
    >
      <PathIcon d={COBRAR_GLYPHS.escanear} size={14} strokeWidth={2.4} color={colors.ink} />
      <MText size="xs" weight="extraBold" color={colors.ink}>
        Del escáner
      </MText>
    </View>
  );
}

export function Articulo(p: {
  readonly e: Existencia;
  /** The escáner opened the sheet on this product. */
  readonly delEscaner?: boolean;
}): ReactElement {
  const { e } = p;
  return (
    <View
      flexDirection="row"
      alignItems="center"
      gap={12}
      padding={12}
      borderRadius={radii[4]}
      backgroundColor={colors.offwhite}
    >
      <ProductoTile icono={e.icono} tint={e.tint} size={52} productoId={e.id} />
      <View flex={1} minWidth={0}>
        <MText size="lgx" weight="extraBold">
          {e.nombre}
        </MText>
        <MText size="sm" weight="semibold" color={colors.gray600} fontVariant={['tabular-nums']}>
          {`Hay ${conUnidad(e.existencias, e.unidad)} · aviso en ${conUnidad(e.umbral, e.unidad)}`}
        </MText>
      </View>
      {p.delEscaner ? <DelEscaner /> : <EstadoChip e={e} />}
    </View>
  );
}

export function Motivos(p: {
  readonly value: MotivoMerma | null;
  readonly onChange: (m: MotivoMerma) => void;
}): ReactElement {
  return (
    <View role="radiogroup" aria-label="¿Qué le pasó?" gap={8}>
      <MText size="body" weight="extraBold">
        ¿Qué le pasó?
      </MText>
      <View flexDirection="row" flexWrap="wrap" gap={8}>
        {MOTIVOS_MERMA.map((m) => (
          <Chip
            key={m}
            label={m}
            selected={p.value === m}
            onPress={() => p.onChange(m)}
            testID={`mover-motivo-${m}`}
          />
        ))}
      </View>
    </View>
  );
}
