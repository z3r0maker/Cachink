/**
 * The product's square on an Inventario row as the photo boards draw it
 * (MvFotoLista): its photo or its glyph on its tint, 44 px. Without a photo
 * it wears the black camera badge and a tap opens the camera; with one, a
 * tap opens «Cambiar o quitar». A long press opens the gallery either way
 * (the boards' secondary path). Where the phone cannot take photos it is the
 * plain square, with nothing to press.
 *
 * The testID says which it is: `producto-foto-<id>` once the product has a
 * photo, `producto-sin-foto-<id>` before.
 */
import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { View } from '@tamagui/core';
import type { ProductIcon } from '@xangarro/caja';
import { MText } from '../components/Mostrador/index';
import { PathIcon } from '../components/PathIcon/index';
import { borderWidths, colors, shapeRadii } from '../theme';
import { ProductoTile } from '../screens/Inventario/mover-glifos';
import { FOTO_GLIFOS } from './foto-glifos';
import { useFotoProducto, useFotoPuertos } from './fotos-context';

export const FOTO_TILE = 44;

function Insignia(): ReactElement {
  return (
    <View
      aria-hidden
      position="absolute"
      right={-7}
      bottom={-7}
      width={20}
      height={20}
      alignItems="center"
      justifyContent="center"
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.thin}
      borderColor={colors.white}
      backgroundColor={colors.black}
    >
      <PathIcon d={FOTO_GLIFOS.camara} size={11} strokeWidth={2.6} color={colors.yellow} />
    </View>
  );
}

export function FotoTile(p: {
  readonly id: string;
  readonly nombre: string;
  readonly icono: ProductIcon;
  readonly tint: string;
  /** The tap, told whether the product already has a photo. */
  readonly onPress: (conFoto: boolean) => void;
  readonly onLongPress: () => void;
}): ReactElement {
  const foto = useFotoProducto(p.id);
  const puertos = useFotoPuertos();
  const tile = <ProductoTile icono={p.icono} tint={p.tint} size={FOTO_TILE} productoId={p.id} />;
  if (puertos === null) return tile;
  return (
    <Pressable
      testID={foto ? `producto-foto-${p.id}` : `producto-sin-foto-${p.id}`}
      role="button"
      aria-label={
        foto ? `Foto de ${p.nombre}. Cambiarla o quitarla` : `Tomar la foto de ${p.nombre}`
      }
      onPress={() => p.onPress(foto !== null)}
      onLongPress={p.onLongPress}
      style={({ pressed }) =>
        pressed ? { transform: [{ translateX: 2 }, { translateY: 2 }] } : undefined
      }
    >
      {tile}
      {foto ? null : <Insignia />}
    </Pressable>
  );
}

/** The hint under the search (MvFotoLista), only where photos can be taken. */
export function PistaFoto(): ReactElement | null {
  if (useFotoPuertos() === null) return null;
  return (
    <View flexDirection="row" alignItems="center" gap={8} testID="inventario-pista-foto">
      <PathIcon d={FOTO_GLIFOS.camara} size={16} strokeWidth={2.2} color={colors.gray600} />
      <MText size="sm" weight="semibold" color={colors.gray600} flex={1} textAlign="left">
        Toca el cuadrito de un producto para ponerle su foto.
      </MText>
    </View>
  );
}
