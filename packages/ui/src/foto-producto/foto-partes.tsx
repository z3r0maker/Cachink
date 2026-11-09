/**
 * The pieces the photo sheets share (boards MvFotoListo, MvFotoSinRecorte,
 * MvFotoCambiar): the big square on the product's tint, «Así se verá en la
 * caja» with the Cobrar tile wearing the new photo, and the grey note.
 */
import type { ReactElement, ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import { View } from '@tamagui/core';
import { formatMoney, type Money } from '@xangarro/domain';
import { MText } from '../components/Mostrador/index';
import { Eyebrow } from '../components/Panel/index';
import { PathIcon } from '../components/PathIcon/index';
import { borderColors, borderWidths, colors, radii, shadows } from '../theme';
import { FotoCuadro } from './foto-cuadro';
import { FOTO_GLIFOS } from './foto-glifos';

/** A product square at the sheets' size, its content on the tint, clipped. */
export function CuadroGrande(p: {
  readonly side: number;
  readonly tint: string;
  readonly label: string;
  readonly children: ReactNode;
  readonly testID?: string;
}): ReactElement {
  return (
    <View
      testID={p.testID}
      role="img"
      aria-label={p.label}
      width={p.side}
      height={p.side}
      alignSelf="center"
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
      borderRadius={radii[7]}
      borderWidth={borderWidths.thick}
      borderColor={colors.black}
      backgroundColor={p.tint}
    >
      {p.children}
    </View>
  );
}

const TILE: ViewStyle = {
  width: 160,
  height: 108,
  justifyContent: 'space-between',
  paddingHorizontal: 12,
  paddingVertical: 10,
  borderRadius: radii[4],
  borderWidth: borderWidths.thin,
  borderColor: colors.black,
  backgroundColor: colors.white,
  boxShadow: shadows.small,
};

const ICONO: ViewStyle = {
  width: 40,
  height: 40,
  overflow: 'hidden',
  borderRadius: radii[2],
  borderWidth: borderWidths.thin,
  borderColor: colors.black,
};

/** The Cobrar tile as it will look: the new photo, the name, the price. */
function TileMuestra(p: {
  nombre: string;
  precio: Money | null;
  uri: string;
  tint: string;
}): ReactElement {
  return (
    <View style={TILE}>
      <View style={[ICONO, { backgroundColor: p.tint }]}>
        <FotoCuadro uri={p.uri} side={40 - 2 * borderWidths.thin} />
      </View>
      <View>
        <MText size="md" weight="extraBold" numberOfLines={1} textAlign="left">
          {p.nombre}
        </MText>
        {p.precio === null ? null : (
          <MText size="md" weight="bold" color={colors.ink} textAlign="left">
            {formatMoney(p.precio)}
          </MText>
        )}
      </View>
    </View>
  );
}

export function AsiSeVera(p: {
  readonly nombre: string;
  readonly precio: Money | null;
  readonly uri: string;
  readonly tint: string;
  readonly nota: string;
}): ReactElement {
  return (
    <View
      testID="foto-asi-se-vera"
      gap={10}
      padding={14}
      borderRadius={radii[6]}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      backgroundColor={colors.offwhite}
    >
      <Eyebrow>Así se verá en la caja</Eyebrow>
      <View flexDirection="row" gap={12} alignItems="center">
        <TileMuestra nombre={p.nombre} precio={p.precio} uri={p.uri} tint={p.tint} />
        <MText flex={1} size="sm" weight="semibold" color={colors.gray600} textAlign="left">
          {p.nota}
        </MText>
      </View>
    </View>
  );
}

/** The grey note with the info glyph: what happened, and what to try. */
export function NotaFoto(p: { readonly titulo: string; readonly cuerpo: string }): ReactElement {
  return (
    <View
      role="status"
      flexDirection="row"
      gap={10}
      alignItems="flex-start"
      paddingHorizontal={14}
      paddingVertical={12}
      borderRadius={radii[4]}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      backgroundColor={colors.offwhite}
    >
      <PathIcon d={FOTO_GLIFOS.info} size={20} strokeWidth={2.2} color={colors.gray600} />
      <View flex={1} gap={2}>
        <MText size="body" weight="extraBold" textAlign="left">
          {p.titulo}
        </MText>
        <MText size="md" weight="semibold" color={colors.gray600} textAlign="left">
          {p.cuerpo}
        </MText>
      </View>
    </View>
  );
}

/** «el portal de Pedro», or «el portal del dueño» until the device knows the name. */
export function portalDe(dueno: string): string {
  if (dueno.trim() === '' || dueno === 'el dueño') return 'el portal del dueño';
  return `el portal de ${dueno.charAt(0).toUpperCase()}${dueno.slice(1)}`;
}
