import type { Money } from '@xangarro/domain';
import type {
  AvanceObjetivo,
  Clausula,
  EventoPlan,
  EventoTarjeta,
  Objetivo,
  Socio,
  Tarjeta,
  TipoTarjeta,
} from '@xangarro/domain/corp';

/**
 * The Tablero's storage (E-20). Small enough to read whole: a quarter is a
 * few dozen cards. Every write that depends on a card's current state runs
 * `decidir` on the card as read under its lock, so an acceptance and an
 * objection at once cannot both land.
 */
export interface ClausulaGuardada extends Clausula {
  readonly id: string;
  readonly at: string;
}

export interface AvisoGuardado {
  readonly trimestre: string;
  readonly para: Socio;
  readonly enviadoEl: string;
  readonly clausulaId: string;
  readonly documentoId: string;
  readonly founderId: string;
}

export interface DatosDelTablero {
  readonly tarjetas: readonly Tarjeta[];
  readonly planes: readonly EventoPlan[];
  readonly objetivos: readonly Objetivo[];
  readonly clausula: ClausulaGuardada | null;
  readonly avisos: readonly AvisoGuardado[];
}

export interface TarjetaNueva {
  readonly trimestre: string;
  readonly tipo: TipoTarjeta;
  readonly titulo: string;
  readonly criterio: string;
  readonly responsable: Socio;
  readonly vence: string;
  readonly objetivoId: string | null;
  readonly valores: Tarjeta['valores'];
}

/** What a card may change: its values, its quote, the plan it left. */
export interface CambioDeTarjeta {
  readonly valores?: Tarjeta['valores'];
  readonly cotizacion?: { readonly monto: Money; readonly documentoId: string };
  readonly descartadaEn?: string;
}

export interface TableroRepository {
  leer(): Promise<DatosDelTablero>;
  crearTarjeta(t: TarjetaNueva, founderId: string): Promise<string>;
  /** Null when the card does not exist. */
  mover(
    tarjetaId: string,
    decidir: (t: Tarjeta) => EventoTarjeta,
    founderId: string,
  ): Promise<EventoTarjeta | null>;
  cambiar(
    tarjetaId: string,
    decidir: (t: Tarjeta) => CambioDeTarjeta,
    founderId: string,
  ): Promise<boolean>;
  agregarAlPlan(e: EventoPlan, founderId: string): Promise<void>;
  crearObjetivo(o: Omit<Objetivo, 'id' | 'avances'>, founderId: string): Promise<string>;
  agregarAvance(objetivoId: string, a: AvanceObjetivo, founderId: string): Promise<void>;
  guardarClausula(c: Clausula, founderId: string): Promise<string>;
  registrarAviso(a: AvisoGuardado): Promise<void>;
}

/** Files a document in the Expediente and returns its id; called only once the write is valid. */
export type Adjunto = () => Promise<string>;
