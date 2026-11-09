/**
 * The product photos the phone shows (M-13, ADR-134), read once and shared:
 * every tile that draws a product — Cobrar, the ticket, Inventario — asks
 * `useFotoProducto(id)` instead of threading photos through each screen.
 *
 * The read is the newest `product_images` row per product; a tombstone means
 * no photo. It is keyed under the caja's queries, so a pull that brings a
 * photo from another caja or a save here refreshes every tile at once.
 *
 * The native half — the lift, the encoder's Skia, the gallery — comes in as
 * {@link FotoPuertos} from the app. Without it (web, tests) photos still
 * show, but nothing offers to take one: an unbuilt path is omitted.
 */
import { createContext, useContext, useMemo, type ReactElement, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { isProductImageTombstone, PRODUCT_IMAGE_MIME, type BusinessId } from '@xangarro/domain';
import type { ProductImage } from '@xangarro/domain';
import { useRepositoriesOrNull } from '../app/repository-provider';
import { useCurrentBusinessId } from '../app-config/use-app-config';
import { cajaKeys } from '../hooks/query-keys';
import type { EncodedPhoto } from './encode';

/** What a tile needs to draw a photo and the «Cambiar o quitar» sheet to describe it. */
export interface FotoVista {
  /** `data:image/webp;base64,…`, ready for an `<Image>`. */
  readonly uri: string;
  readonly createdAt: string;
  readonly deviceId: string;
}

/** The phone's half of taking a photo, supplied by the app shell. */
export interface FotoPuertos {
  /** The photo at a file URI lifted off its background, or squared (`lifted: false`). */
  recortar(uri: string): Promise<{ readonly uri: string; readonly lifted: boolean }>;
  /** The PNG at `uri` encoded as the row carries it. */
  codificar(uri: string, lifted: boolean): Promise<EncodedPhoto>;
  /** A photo picked from the gallery, or null when the operator backed out. */
  elegirDeGaleria(): Promise<string | null>;
}

interface FotosValor {
  readonly fotos: ReadonlyMap<string, FotoVista>;
  readonly puertos: FotoPuertos | null;
}

const VACIO: FotosValor = { fotos: new Map(), puertos: null };
const FotosContext = createContext<FotosValor>(VACIO);

/** The key the photo read lives under, for the save to refresh. */
export function fotosKey(businessId: BusinessId | null): readonly unknown[] {
  return [...cajaKeys.byBusiness(businessId), 'fotos-producto'];
}

/** A photo row as a tile draws it; null for a tombstone. */
export function comoFotoVista(row: ProductImage): FotoVista | null {
  if (isProductImageTombstone(row) || row.bytes === null) return null;
  return {
    uri: `data:${PRODUCT_IMAGE_MIME};base64,${row.bytes}`,
    createdAt: row.createdAt,
    deviceId: row.deviceId,
  };
}

function useLecturaFotos(): ReadonlyMap<string, FotoVista> {
  // Mounted app-wide, so it may render before the database is up: no
  // repositories yet means no photos yet, not an error.
  const repos = useRepositoriesOrNull();
  const businessId = useCurrentBusinessId() as BusinessId | null;
  const q = useQuery({
    queryKey: fotosKey(businessId),
    enabled: businessId !== null && repos !== null,
    queryFn: async () => {
      if (repos === null) return new Map<string, FotoVista>();
      const rows = await repos.productImages.latestForBusiness(businessId as BusinessId);
      const out = new Map<string, FotoVista>();
      for (const [id, row] of rows) {
        const vista = comoFotoVista(row);
        if (vista !== null) out.set(id, vista);
      }
      return out;
    },
  });
  return q.data ?? VACIO.fotos;
}

export function FotosProductoProvider(props: {
  readonly puertos?: FotoPuertos | null;
  readonly children: ReactNode;
}): ReactElement {
  const fotos = useLecturaFotos();
  const puertos = props.puertos ?? null;
  const valor = useMemo(() => ({ fotos, puertos }), [fotos, puertos]);
  return <FotosContext.Provider value={valor}>{props.children}</FotosContext.Provider>;
}

/** A product's photo, or null when it shows its icon. */
export function useFotoProducto(productoId: string | null | undefined): FotoVista | null {
  const { fotos } = useContext(FotosContext);
  return productoId ? (fotos.get(productoId) ?? null) : null;
}

/** The app's camera, lift and gallery, or null where the phone cannot take photos. */
export function useFotoPuertos(): FotoPuertos | null {
  return useContext(FotosContext).puertos;
}
