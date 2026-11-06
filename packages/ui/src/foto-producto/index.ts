/** The product photo on the phone (M-13, ADR-134). */
export {
  encodeProductPhoto,
  PHOTO_MARGIN,
  PHOTO_QUALITIES,
  type EncodedPhoto,
  type SkiaApi,
} from './encode';
export {
  comoFotoVista,
  fotosKey,
  FotosProductoProvider,
  useFotoProducto,
  useFotoPuertos,
  type FotoPuertos,
  type FotoVista,
} from './fotos-context';
export { FotoTile, FOTO_TILE } from './foto-tile';
export { FotoHojas } from './foto-hojas';
export { useFotoFlujo, type FotoFlujo, type FotoSujeto } from './use-foto-flujo';
