import type { TemaId } from './temas.js';

/** Where a guide is read: the owner's portal, or the caja (phone, tablet and web caja alike). */
export type Superficie = 'portal' | 'caja';

/**
 * The caja's screens, named the same on the phone and in the browser. A caja
 * guide belongs to some of them and ends on one; each surface turns the name
 * into its own route.
 */
export const PANTALLAS_CAJA = [
  'inicio',
  'cobrar',
  'ventas',
  'mi-turno',
  'gastos',
  'inventario',
  'cierre',
] as const;
export type PantallaCaja = (typeof PANTALLAS_CAJA)[number];

/** What the caja runs on: the phone and tablet app, or a browser. */
export type Dispositivo = 'telefono' | 'web';

/** One step of a guide. */
export interface Paso {
  /** What the step says on screen. */
  readonly texto: string;
  /** The line Don Cuentas says for it, written to be spoken. Absent until the guide has its voice. */
  readonly voz?: string;
  /** The control the step is about, by the testID its test flow taps. */
  readonly control?: string;
}

/**
 * One of Don Cuentas's guides (ADR-107, ADR-163): a job done one step at a
 * time, each step short enough to read at the counter, ending on the screen
 * where the job is done.
 */
export interface Guia {
  readonly id: string;
  readonly superficie: Superficie;
  readonly tema: TemaId;
  readonly titulo: string;
  readonly minutos: number;
  readonly pasos: readonly Paso[];
  /** Where the last step takes the person: a portal route, or one of `PANTALLAS_CAJA`. */
  readonly ir: { readonly label: string; readonly href: string };
  /** The screens the guide is about; help opened on one of them lists it first. */
  readonly pantallas: readonly string[];
  /** A caja guide only one device can follow: the scanner needs the phone's camera. */
  readonly soloEn?: Dispositivo;
  /** Whether xangarro.mx may show it to someone with no account. */
  readonly publica: boolean;
  /** Its clip, once one is recorded. With none, the steps stand alone. */
  readonly clip?: string;
}
