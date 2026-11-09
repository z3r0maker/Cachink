'use client';

import type { ProductIcon } from '@xangarro/domain';
import { useState } from 'react';

import { ProductGlyph } from './product-glyph';
import { photo } from './product-photo.css';

/**
 * A product's photo, or its glyph (P-42, ADR-134). The photo is the phone's
 * 512 px WebP with the background lifted, so it sits on the tile's own tint;
 * the URL carries the row's id, which changes with every new photo. A photo
 * that fails to load falls back to the glyph without a notice: the tile
 * looks like it did before photos existed, never broken.
 */
export function productPhotoUrl(productoId: string, fotoId: string): string {
  return `/api/productos/${encodeURIComponent(productoId)}/imagen?v=${encodeURIComponent(fotoId)}`;
}

export function ProductPhoto(props: {
  readonly productoId: string;
  /** The current photo row's id, or null when the product has none. */
  readonly fotoId: string | null;
  readonly icon: ProductIcon;
  /** The glyph's size in px when there is no photo. */
  readonly glyphSize: number;
  /** The photo's side in px: the tile's inside, so the 512 px file never sizes it. */
  readonly size: number;
  /** Alt text when the photo shows; the glyph is decorative. */
  readonly alt: string;
}) {
  const [failedFor, setFailedFor] = useState<string | null>(null);
  const { fotoId } = props;
  if (fotoId === null || failedFor === fotoId) {
    return <ProductGlyph icon={props.icon} size={props.glyphSize} />;
  }
  return (
    // A same-origin, session-scoped route: next/image's optimizer would cache
    // it across tenants, so a plain <img> it is.
    <img
      className={photo}
      src={productPhotoUrl(props.productoId, fotoId)}
      alt={props.alt}
      width={props.size}
      height={props.size}
      data-testid={`producto-foto-${props.productoId}`}
      onError={() => setFailedFor(fotoId)}
    />
  );
}
