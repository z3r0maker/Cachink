/**
 * A barcode names one product (P-44, ADR-150 §2). The portal's create and edit
 * refuse a code another live product of the business already has; the phone
 * passes no port and never checks, since an offline alta must not bounce
 * (ADR-053 §5) and its escáner asks which product instead (M-19).
 */
import { codigoCanonico, CodigoDuplicadoError } from '@xangarro/domain';

/** Who has a code: the business's live products with that canonical key. */
export interface CodigosDeProducto {
  conCodigo(clave: string): Promise<readonly { readonly id: string; readonly nombre: string }[]>;
}

/**
 * Throws `CodigoDuplicadoError` when another product (`propio` excluded)
 * already has `sku`'s key. An empty code is never a duplicate; without a port
 * (the phone) nothing is checked.
 */
export async function asegurarCodigoLibre(
  codigos: CodigosDeProducto | undefined,
  sku: string | null | undefined,
  propio?: string,
): Promise<void> {
  const clave = codigoCanonico(sku);
  if (codigos === undefined || clave === null) return;
  const otro = (await codigos.conCodigo(clave)).find((p) => p.id !== propio);
  if (otro !== undefined) throw new CodigoDuplicadoError((sku ?? '').trim(), otro.nombre);
}
