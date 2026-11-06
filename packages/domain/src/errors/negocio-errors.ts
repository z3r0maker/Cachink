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

/** Typed errors for the payroll roster (P-12). */
export class EmpleadoInvalidoError extends Error {
  readonly code = 'EMPLEADO_INVALIDO' as const;

  constructor(readonly campos: Readonly<Record<string, string>>) {
    super(Object.values(campos)[0] ?? 'Revisa los datos del empleado.');
    this.name = 'EmpleadoInvalidoError';
  }
}

export class EmpleadoNoEncontradoError extends Error {
  readonly code = 'EMPLEADO_NO_ENCONTRADO' as const;

  constructor(readonly id: string) {
    super('Ese empleado ya no está en tu nómina.');
    this.name = 'EmpleadoNoEncontradoError';
  }
}
