/**
 * A product's photo inside its tinted square (M-13; FotoMuestra on the
 * boards): the 512 px WebP from its `data:` URI, filling the square inside
 * the black edge. A lifted cutout keeps its 8 % margin, so the tint shows
 * around it; a photo that was not lifted covers the tint edge to edge.
 */
import type { ReactElement } from 'react';
import { Image } from 'react-native';

export function FotoCuadro(p: { readonly uri: string; readonly side: number }): ReactElement {
  return (
    <Image
      source={{ uri: p.uri }}
      style={{ width: p.side, height: p.side }}
      resizeMode="cover"
      aria-hidden
    />
  );
}
