/** Typed errors for a product's barcode (M-19, P-44, ADR-150). */

/** Another live product of the business already has this code. */
export class CodigoDuplicadoError extends Error {
  readonly code = 'CODIGO_DUPLICADO' as const;

  constructor(
    /** The code as it was typed or read. */
    readonly codigo: string,
    /** The name of the product that already has it. */
    readonly otroProducto: string,
  ) {
    super(`Ese código ya lo tiene «${otroProducto}».`);
    this.name = 'CodigoDuplicadoError';
  }
}
