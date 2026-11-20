import { nombreMes } from '../../asesor/insights.js';

/** Typed errors of the contador's export (E-43, CLAUDE.md §8), each in the founders' words. */
export type CodigoContador =
  | 'CODIGO_FORMATO'
  | 'CODIGO_CUENTA'
  | 'CODIGOS_SIN_LISTA'
  | 'CODIGOS_DESACTUALIZADA'
  | 'CODIGOS_INCOMPLETOS'
  | 'CODIGOS_YA_VALIDADOS'
  | 'CODIGOS_FECHA'
  | 'CODIGOS_FECHA_FUTURA'
  | 'PAQUETE_MES'
  | 'PAQUETE_SIN_TERMINAR'
  | 'PAQUETE_ARCHIVO';

const cap = (s: string) => `${s.charAt(0).toUpperCase()}${s.slice(1)}`;

const MENSAJES: Record<CodigoContador, (detalle: string) => string> = {
  CODIGO_FORMATO: (cuenta) =>
    `El código de ${cuenta} no se lee: escríbelo como lo manda el contador, por ejemplo 102.01.`,
  CODIGO_CUENTA: () => 'Esa cuenta no está en la consola.',
  CODIGOS_SIN_LISTA: () => 'Aún no hay códigos que validar.',
  CODIGOS_DESACTUALIZADA: () =>
    'Los códigos cambiaron mientras tanto: revisa los de ahora y márcalos otra vez.',
  CODIGOS_INCOMPLETOS: (n) => `Faltan ${n} códigos para marcar la lista como validada.`,
  CODIGOS_YA_VALIDADOS: () => 'Esta lista ya está validada.',
  CODIGOS_FECHA: () => 'Escribe el día en que el contador validó la lista.',
  CODIGOS_FECHA_FUTURA: () => 'El día de la validación no puede ser después de hoy.',
  PAQUETE_MES: () => 'Elige un mes válido.',
  PAQUETE_SIN_TERMINAR: (mes) =>
    `${cap(nombreMes(mes))} aún no termina: su paquete sale cuando acabe.`,
  PAQUETE_ARCHIVO: (nombre) => `No encontramos el archivo «${nombre}» del Expediente.`,
};

export class ContadorError extends Error {
  constructor(
    readonly code: CodigoContador,
    detalle = '',
  ) {
    super(MENSAJES[code](detalle));
    this.name = 'ContadorError';
  }
}
