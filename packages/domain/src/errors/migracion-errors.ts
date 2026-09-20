/** Typed errors for the assisted-import flow (N-18, «Hazlo por mí»). */

export class ImportacionAsistidaNoDisponible extends Error {
  readonly code = 'IMPORTACION_ASISTIDA_NO_DISPONIBLE' as const;

  constructor() {
    super('Hazlo por mí está disponible en los planes de pago.');
    this.name = 'ImportacionAsistidaNoDisponible';
  }
}

export class ImportacionAsistidaYaActiva extends Error {
  readonly code = 'IMPORTACION_ASISTIDA_YA_ACTIVA' as const;

  constructor() {
    super('Ya tienes una migración en curso. Espera a que termine para pedir otra.');
    this.name = 'ImportacionAsistidaYaActiva';
  }
}

export class ImportacionAsistidaInvalida extends Error {
  readonly code = 'IMPORTACION_ASISTIDA_INVALIDA' as const;

  constructor(readonly campos: readonly string[]) {
    super(`Revisa estos datos de tu solicitud: ${campos.join(', ')}.`);
    this.name = 'ImportacionAsistidaInvalida';
  }
}
