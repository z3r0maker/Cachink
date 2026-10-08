/**
 * Linking a big business (DS-10): the first download comes in pages, and the
 * caja's «Conectar esta caja» and the phone's activation say where it stands
 * («Descargando los datos de tu negocio… 3 de 7»). Pure.
 */

/** `snapshotProgress` from `@xangarro/sync`: pages applied, and the first page's estimate. */
export interface ProgresoDescarga {
  readonly pagina: number;
  /** Null from an older server, which sends no estimate. */
  readonly paginas: number | null;
}

export const DESCARGANDO = 'Descargando los datos de tu negocio…';
export const DESCARGA_INTERRUMPIDA =
  'Se interrumpió la descarga. Lo que ya bajó se queda; toca Reintentar.';
export const TERMINANDO_INVENTARIO = 'Terminando de descargar el inventario…';
export const DESCARGA_ARIA = 'Descarga de los datos del negocio';

/** «3 de 7»; «Página 3» without an estimate; nothing before the first page. */
export function textoPaginas(p: ProgresoDescarga | null): string {
  if (p === null) return '';
  return p.paginas === null ? `Página ${p.pagina}` : `${p.pagina} de ${p.paginas}`;
}

/** How full the bar is, 0 to 1; null when there is no estimate to measure against. */
export function fraccionDescarga(p: ProgresoDescarga | null): number | null {
  if (p === null) return 0;
  if (p.paginas === null) return null;
  return Math.min(1, Math.max(0, p.pagina / p.paginas));
}
