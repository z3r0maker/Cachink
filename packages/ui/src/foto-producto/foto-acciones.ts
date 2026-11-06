/**
 * What the photo sheets do, apart from their state (M-13): turn a camera or
 * gallery file into the row's WebP, and write or remove the row through the
 * use cases. Each returns the next step or throws a typed error whose
 * message the sheet shows.
 */
import { CapturarFotoProductoUseCase, QuitarFotoProductoUseCase } from '@xangarro/application';
import { PRODUCT_IMAGE_MIME, PRODUCT_IMAGE_SIDE, type ProductId } from '@xangarro/domain';
import type { Repositories } from '../app/repository-provider';
import type { EncodedPhoto } from './encode';
import type { FotoPuertos } from './fotos-context';

/** The photo ready for «Listo»: the row's bytes and a URI to show them. */
export interface FotoLista {
  /** The file as the camera or the gallery left it, for the lift's first frame. */
  readonly original: string;
  readonly lifted: boolean;
  readonly encoded: EncodedPhoto;
  readonly uri: string;
}

type R = Pick<Repositories, 'products' | 'productImages'>;

/** Camera or gallery file → lifted (or squared) → 512 px WebP. */
export async function procesarFoto(puertos: FotoPuertos, original: string): Promise<FotoLista> {
  const recorte = await puertos.recortar(original);
  const encoded = await puertos.codificar(recorte.uri, recorte.lifted);
  return {
    original,
    lifted: recorte.lifted,
    encoded,
    uri: `data:${PRODUCT_IMAGE_MIME};base64,${encoded.base64}`,
  };
}

export async function guardarFoto(r: R, productoId: string, foto: FotoLista): Promise<void> {
  await new CapturarFotoProductoUseCase(r.products, r.productImages).execute({
    productoId: productoId as ProductId,
    bytes: foto.encoded.base64,
    width: PRODUCT_IMAGE_SIDE,
    height: PRODUCT_IMAGE_SIDE,
  });
}

export async function quitarFoto(r: R, productoId: string): Promise<void> {
  await new QuitarFotoProductoUseCase(r.products, r.productImages).execute({
    productoId: productoId as ProductId,
  });
}

/** The product's sale price for «Así se verá en la caja», or null when unknown. */
export async function precioDe(r: R, productoId: string): Promise<bigint | null> {
  const p = await r.products.findById(productoId as ProductId);
  return p?.precioVentaCentavos ?? null;
}

/** A thrown error as the sheet says it. */
export function mensajeDe(e: unknown): string {
  return e instanceof Error && e.message
    ? e.message
    : 'No se pudo guardar la foto. Intenta otra vez.';
}
