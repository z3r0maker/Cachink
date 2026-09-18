/** Typed errors for editing the business itself (P-08). */

export type NegocioCampo =
  | 'nombre'
  | 'regimen'
  | 'isrTasa'
  | 'rfc'
  | 'razonSocial'
  | 'codigoPostal'
  | 'usoCfdi'
  | 'metodosPago';

export interface NegocioErrores {
  readonly campos: Partial<Record<NegocioCampo, string>>;
  /** Per row of «Atributos de producto», by index. */
  readonly atributos: Readonly<Record<number, string>>;
}

export class NegocioInvalidoError extends Error {
  readonly code = 'NEGOCIO_INVALIDO' as const;

  constructor(readonly errores: NegocioErrores) {
    super('Revisa los datos marcados.');
    this.name = 'NegocioInvalidoError';
  }
}
