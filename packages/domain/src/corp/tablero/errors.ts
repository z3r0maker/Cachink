/** Typed errors of the Tablero (E-20, CLAUDE.md §8), each in the founders' words. */
export type CodigoTablero =
  | 'TARJETA_DESCONOCIDA'
  | 'TARJETA_TITULO'
  | 'TARJETA_CRITERIO'
  | 'TARJETA_VENCE'
  | 'TARJETA_TRIMESTRE'
  | 'TARJETA_VALOR'
  | 'TARJETA_SIN_VALOR'
  | 'TARJETA_CONGELADA'
  | 'TARJETA_DESCARTADA'
  | 'TARJETA_AUN_NO'
  | 'TARJETA_ESTADO'
  | 'SOLO_RESPONSABLE'
  | 'SOLO_EL_OTRO'
  | 'PLAZO_VENCIDO'
  | 'EVIDENCIA'
  | 'MOTIVO'
  | 'MEDIADOR_DOCUMENTO'
  | 'MEDIADOR_CERRADO'
  | 'COTIZACION_NO_REQUERIDA'
  | 'COTIZACION_DOCUMENTO'
  | 'PLAN_ESTADO'
  | 'PLAN_EL_OTRO'
  | 'PLAN_FUERA_DE_PLAZO'
  | 'PLAN_SIN_VALORES'
  | 'OBJETIVO_DESCONOCIDO'
  | 'OBJETIVO_TITULO'
  | 'OBJETIVO_META'
  | 'OBJETIVO_CERRADO'
  | 'OBJETIVO_AUN_NO'
  | 'AVANCE_VALOR'
  | 'CLAUSULA_NUMERO'
  | 'CLAUSULA_TEXTO'
  | 'AVISO_NO_APLICA'
  | 'AVISO_SIN_CLAUSULA'
  | 'AVISO_EL_OTRO'
  | 'AVISO_YA_ENVIADO'
  | 'AVISO_FECHA';

const MENSAJES: Record<CodigoTablero, (detalle: string) => string> = {
  TARJETA_DESCONOCIDA: () => 'Esa tarjeta no existe.',
  TARJETA_TITULO: () => 'Escribe el título de la tarjeta.',
  TARJETA_CRITERIO: () =>
    'Escribe el criterio de terminado: algo que un tercero pueda decir sí o no sin preguntarte.',
  TARJETA_VENCE: (t) => `La fecha tiene que caer dentro del ${t}.`,
  TARJETA_TRIMESTRE: () => 'Las tarjetas van al trimestre en curso o al plan del siguiente.',
  TARJETA_VALOR: () => 'Escribe tu propuesta de valor en pesos, mayor a cero.',
  TARJETA_SIN_VALOR: () =>
    'Esta tarjeta aún no tiene valor: los dos ponen el suyo, o la cotización si difieren más del doble.',
  TARJETA_CONGELADA: () => 'El valor de esta tarjeta ya está congelado.',
  TARJETA_DESCARTADA: () => 'Esa tarjeta se quitó del plan.',
  TARJETA_AUN_NO: (t) => `El ${t} aún no empieza: su tarjeta se mueve desde su primer día.`,
  TARJETA_ESTADO: () => 'Esa tarjeta ya no está en ese paso.',
  SOLO_RESPONSABLE: (s) => `Esto lo hace el responsable, Fundador ${s}.`,
  SOLO_EL_OTRO: (s) => `La revisa el otro socio, Fundador ${s}.`,
  PLAZO_VENCIDO: (f) => `El plazo para objetar terminó el ${f}: la tarjeta quedó aceptada.`,
  EVIDENCIA: () => 'Adjunta la evidencia: un archivo o un enlace.',
  MOTIVO: () => 'Escribe qué parte del criterio no se cumple.',
  MEDIADOR_DOCUMENTO: () => 'Adjunta el documento del mediador.',
  MEDIADOR_CERRADO: (t) =>
    `El ${t} ya cerró: corrígela y márcala terminada otra vez, y contará en el trimestre en que se acepte.`,
  COTIZACION_NO_REQUERIDA: () =>
    'Esta tarjeta no necesita cotización: sus valores no difieren más del doble.',
  COTIZACION_DOCUMENTO: () => 'Adjunta la cotización del tercero y escribe su monto sin IVA.',
  PLAN_ESTADO: (t) => `El plan del ${t} ya no está en ese paso.`,
  PLAN_EL_OTRO: () => 'Quien envía el plan no puede aprobarlo: lo aprueba el otro socio.',
  PLAN_FUERA_DE_PLAZO: (f) =>
    `El plan se aprobaba hasta el ${f}. Sin plan aprobado, el compromiso es el del trimestre anterior.`,
  PLAN_SIN_VALORES: (n) =>
    `Faltan valores en ${n} del plan: los dos ponen el suyo antes de aprobarlo.`,
  OBJETIVO_DESCONOCIDO: () => 'Ese objetivo no existe.',
  OBJETIVO_TITULO: () => 'Escribe el objetivo.',
  OBJETIVO_META: () => 'Escribe la meta como un número entero mayor a cero, con su unidad.',
  OBJETIVO_CERRADO: (t) => `El ${t} ya terminó: su objetivo quedó como estaba.`,
  OBJETIVO_AUN_NO: (t) => `El ${t} aún no empieza: su avance se registra desde su primer día.`,
  AVANCE_VALOR: () => 'Escribe el avance como un número entero, cero o más.',
  CLAUSULA_NUMERO: () => 'Escribe el número de la cláusula, como está en el acuerdo.',
  CLAUSULA_TEXTO: () => 'Pega el texto de la cláusula, tal como está en el acuerdo firmado.',
  AVISO_NO_APLICA: (t) =>
    `En el ${t} no hay aviso que mandar: sólo aplica cuando un socio no llega al mínimo y el otro sí.`,
  AVISO_SIN_CLAUSULA: () => 'Para preparar el aviso, guarda primero la cláusula del acuerdo.',
  AVISO_EL_OTRO: () => 'El aviso lo manda el socio que cumplió.',
  AVISO_YA_ENVIADO: () => 'Ese aviso ya se marcó como enviado.',
  AVISO_FECHA: () => 'Escribe el día en que lo enviaste; no puede ser después de hoy.',
};

export class TableroError extends Error {
  constructor(
    readonly code: CodigoTablero,
    detalle = '',
  ) {
    super(MENSAJES[code](detalle));
    this.name = 'TableroError';
  }
}
