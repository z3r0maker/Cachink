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
import { Chip, MText } from '../../components/index';
import { colors, radii } from '../../theme';
import { ProductoTile } from './mover-glifos';
import { EstadoChip } from './inventario-filas';

export function Articulo({ e }: { readonly e: Existencia }): ReactElement {
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
      <EstadoChip e={e} />
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
