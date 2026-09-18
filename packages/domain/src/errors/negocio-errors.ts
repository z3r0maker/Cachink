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

export class ConfirmacionNombreError extends Error {
  readonly code = 'CONFIRMACION_NOMBRE' as const;

  constructor() {
    super('Escribe el nombre del negocio tal cual para confirmar.');
    this.name = 'ConfirmacionNombreError';
  }
}

export class SuscripcionActivaError extends Error {
  readonly code = 'SUSCRIPCION_ACTIVA' as const;

  constructor() {
    super('Tu suscripción sigue activa. Cancélala en Suscripción antes de archivar.');
    this.name = 'SuscripcionActivaError';
  }
}
