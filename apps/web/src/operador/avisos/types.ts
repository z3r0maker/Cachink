/** «De Pedro» (owner messages) or «De tu caja» (derived on the device, ADR-075). */
export type AvisoGrupo = 'dueno' | 'caja';

/** Head tint by kind of notice, from the design file. */
export type AvisoTono = 'alerta' | 'dueno' | 'atencion' | 'info' | 'hecho';

export interface Aviso {
  readonly id: string;
  readonly grupo: AvisoGrupo;
  readonly tipo: string;
  readonly titulo: string;
  readonly cuerpo: string;
  readonly hora: string;
  readonly icono: string;
  readonly tono: AvisoTono;
  readonly cta?: { readonly label: string; readonly href: string };
  /** When set, the notice asks for a reply about this subject (the corte). */
  readonly responder?: { readonly asunto: string };
  readonly leido: boolean;
  readonly respuesta?: string;
}

export interface AvisosData {
  readonly dueno: string;
  readonly avisos: readonly Aviso[];
}

export interface AvisosScreenProps {
  readonly state: 'happy' | 'loading' | 'empty' | 'error';
  readonly data: AvisosData;
  readonly tab: AvisoGrupo;
}
