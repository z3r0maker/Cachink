/** Typed errors of Presupuesto (E-22, CLAUDE.md §8), each in the founders' words. */
export type CodigoPresupuesto =
  | 'PRESUPUESTO_TRIMESTRE'
  | 'PRESUPUESTO_PASADO'
  | 'PRESUPUESTO_PENDIENTE'
  | 'PRESUPUESTO_APROBADO'
  | 'PRESUPUESTO_MONTOS'
  | 'PRESUPUESTO_DESCONOCIDO'
  | 'PRESUPUESTO_RESPONDIDO'
  | 'PRESUPUESTO_MISMO_SOCIO'
  | 'SOLICITUD_CONCEPTO'
  | 'SOLICITUD_MONTO'
  | 'SOLICITUD_CATEGORIA'
  | 'SOLICITUD_DESCONOCIDA'
  | 'SOLICITUD_RESPONDIDA'
  | 'SOLICITUD_MISMO_SOCIO'
  | 'SOLICITUD_OTRO_MONTO';

const MENSAJES: Record<CodigoPresupuesto, (detalle: string) => string> = {
  PRESUPUESTO_TRIMESTRE: () => 'Elige un trimestre válido.',
  PRESUPUESTO_PASADO: (t) => `El ${t} ya terminó.`,
  PRESUPUESTO_PENDIENTE: (t) => `El ${t} ya tiene un presupuesto esperando aprobación.`,
  PRESUPUESTO_APROBADO: (t) => `El ${t} ya tiene su presupuesto aprobado.`,
  PRESUPUESTO_MONTOS: () => 'Escribe un monto al mes para cada categoría, en pesos.',
  PRESUPUESTO_DESCONOCIDO: () => 'Ese presupuesto no existe.',
  PRESUPUESTO_RESPONDIDO: () => 'Ese presupuesto ya tiene respuesta.',
  PRESUPUESTO_MISMO_SOCIO: () =>
    'Quien prepara el presupuesto no puede aprobarlo: lo aprueba el otro socio.',
  SOLICITUD_CONCEPTO: () => 'Escribe para qué es el gasto.',
  SOLICITUD_MONTO: () => 'Escribe el monto en pesos, mayor a cero.',
  SOLICITUD_CATEGORIA: () => 'Elige la categoría del gasto.',
  SOLICITUD_DESCONOCIDA: () => 'Esa solicitud no existe.',
  SOLICITUD_RESPONDIDA: () => 'Esa solicitud ya tiene respuesta.',
  SOLICITUD_MISMO_SOCIO: () => 'Quien pide el gasto no puede aprobarlo: lo aprueba el otro socio.',
  SOLICITUD_OTRO_MONTO: () =>
    'El monto que apruebas debe ser mayor a cero y menor a lo que se pidió.',
};

export class PresupuestoError extends Error {
  constructor(
    readonly code: CodigoPresupuesto,
    detalle = '',
  ) {
    super(MENSAJES[code](detalle));
    this.name = 'PresupuestoError';
  }
}
