/**
 * The fields of «¿Qué pasó con la mercancía?» (MvInventario's sheet; the
 * web's `mover-campos.tsx`): the product with its stock, what happened to a
 * merma, and the optional texts («(si quieres)»). The kinds of move are in
 * `mover-tipos.tsx`, the quantity in `mover-cantidad.tsx`.
 */
import type { ReactElement } from 'react';
import { TextInput } from 'react-native';
import { View } from '@tamagui/core';
import { conUnidad, MOTIVOS_MERMA, type MotivoMerma } from '@xangarro/caja/inventario';
import { Chip, MText } from '../../components/index';
import {
  borderColors,
  borderWidths,
  colors,
  portalFontSizes,
  radii,
  typography,
} from '../../theme';
import { ProductoIcono } from '../Ventas/cobrar-tile';
import { EstadoChip } from './inventario-filas';
import type { ExistenciaMovil } from './inventario-registro';

export function Articulo({ e }: { readonly e: ExistenciaMovil }): ReactElement {
  return (
    <View
      flexDirection="row"
      alignItems="center"
      gap={12}
      padding={12}
      borderRadius={radii[4]}
      backgroundColor={colors.offwhite}
    >
      <ProductoIcono icono={e.glifo} tint={e.tint} size={52} />
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

export function Opcional(p: {
  readonly label: string;
  readonly placeholder: string;
  readonly value: string;
  readonly onChange: (v: string) => void;
  readonly testID: string;
}): ReactElement {
  return (
    <View gap={8}>
      <MText size="body" weight="extraBold">
        {p.label}{' '}
        <MText size="body" weight="semibold" color={colors.textMuted}>
          (si quieres)
        </MText>
      </MText>
      <TextInput
        testID={p.testID}
        aria-label={p.label}
        placeholder={p.placeholder}
        placeholderTextColor={colors.textMuted}
        value={p.value}
        onChangeText={p.onChange}
        maxLength={200}
        style={{
          height: 48,
          paddingHorizontal: 14,
          borderRadius: radii[3],
          borderWidth: borderWidths.quiet,
          borderColor: borderColors.quiet,
          fontFamily: typography.fontFamily,
          fontWeight: '600',
          fontSize: portalFontSizes.body,
          color: colors.black,
        }}
      />
    </View>
  );
}
