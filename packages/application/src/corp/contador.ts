import {
  assertMesTerminado,
  assertPuedeValidar,
  balanzaCsv,
  balanzaDelMes,
  ContadorError,
  emitidasCsv,
  estadoDeCodigos,
  leerCodigos,
  mismosCodigos,
  nombreDeLaBalanza,
  nombreDelPaquete,
  rutasDelPaquete,
  type CfdiEmitido,
  type Codigos,
  type EstadoCodigos,
  type ListaDeCodigos,
  type SumaDelTramo,
  type TipoPaquete,
  type ValidacionDeCodigos,
} from '@xangarro/domain/corp';

/**
 * The contador's export (E-43, boards CD-10d and CD-10e): the códigos
 * agrupadores the founders type in and mark as validated, and the month's
 * package. The package is built whole in memory: one month of a small
 * company is a few megabytes. Zipping it is the console's job.
 */
export interface CodigosRepository {
  /** Oldest first. */
  listas(): Promise<readonly ListaDeCodigos[]>;
  validaciones(): Promise<readonly ValidacionDeCodigos[]>;
  guardar(l: { readonly codigos: Codigos; readonly founderId: string }): Promise<ListaDeCodigos>;
  validar(v: {
    readonly listaId: string;
    readonly fecha: string;
    readonly founderId: string;
  }): Promise<ValidacionDeCodigos>;
}

export interface CodigosDeps {
  readonly codigos: CodigosRepository;
}

export async function leerEstadoDeCodigos(repo: CodigosRepository): Promise<EstadoCodigos> {
  const [listas, validaciones] = await Promise.all([repo.listas(), repo.validaciones()]);
  return estadoDeCodigos(listas, validaciones);
}

/**
 * Saves the form's codes as a new list, unless they are the ones there are:
 * then nothing is written (null), and a validation stands.
 */
export async function guardarCodigos(
  deps: CodigosDeps,
  input: { readonly codigos: Readonly<Record<string, string>>; readonly founderId: string },
): Promise<ListaDeCodigos | null> {
  const codigos = leerCodigos(input.codigos);
  const { lista } = await leerEstadoDeCodigos(deps.codigos);
  if (mismosCodigos(lista?.codigos ?? new Map(), codigos)) return null;
  return deps.codigos.guardar({ codigos, founderId: input.founderId });
}

export async function validarCodigos(
  deps: CodigosDeps,
  input: {
    readonly listaId: string;
    readonly fecha: string;
    readonly hoy: string;
    readonly founderId: string;
  },
): Promise<ValidacionDeCodigos> {
  assertPuedeValidar(
    await leerEstadoDeCodigos(deps.codigos),
    input.listaId,
    input.fecha,
    input.hoy,
  );
  return deps.codigos.validar({
    listaId: input.listaId,
    fecha: input.fecha,
    founderId: input.founderId,
  });
}

export interface ComprobanteDelPaquete {
  readonly nombre: string;
  /** Null when the store has no bytes under its key. */
  leer(): Promise<Uint8Array | null>;
}

export interface FuentesDelPaquete extends CodigosDeps {
  sumas(mes: string): Promise<readonly SumaDelTramo[]>;
  cerrado(mes: string): Promise<boolean>;
  emitidas(mes: string): Promise<readonly CfdiEmitido[]>;
  /** The month's registered received invoices, as uploaded. */
  recibidas(mes: string): Promise<readonly { readonly nombre: string; readonly xml: Uint8Array }[]>;
  comprobantes(mes: string): Promise<readonly ComprobanteDelPaquete[]>;
}

export interface ArchivoDelPaquete {
  readonly ruta: string;
  /** A CSV is text, written as UTF-8; a kept file is its bytes. */
  readonly contenido: Uint8Array | string;
}

export interface Paquete {
  readonly nombre: string;
  readonly tipo: TipoPaquete;
  readonly archivos: readonly ArchivoDelPaquete[];
}

async function acuses(deps: FuentesDelPaquete, mes: string): Promise<ArchivoDelPaquete[]> {
  const docs = await deps.comprobantes(mes);
  const rutas = rutasDelPaquete(
    'acuses',
    docs.map((d) => d.nombre),
  );
  return Promise.all(
    docs.map(async (d, i) => {
      const contenido = await d.leer();
      if (contenido === null) throw new ContadorError('PAQUETE_ARCHIVO', d.nombre);
      return { ruta: rutas[i] ?? `acuses/${i}`, contenido };
    }),
  );
}

/** «final» once the month is closed; «preliminar», with what there is today, until then. */
export async function armarPaquete(
  deps: FuentesDelPaquete,
  input: { readonly mes: string; readonly hoy: string },
): Promise<Paquete> {
  const { mes } = input;
  assertMesTerminado(mes, input.hoy);
  const [sumas, estado, cerrado, emitidas, recibidas, comprobantes] = await Promise.all([
    deps.sumas(mes),
    leerEstadoDeCodigos(deps.codigos),
    deps.cerrado(mes),
    deps.emitidas(mes),
    deps.recibidas(mes),
    acuses(deps, mes),
  ]);
  const tipo: TipoPaquete = cerrado ? 'final' : 'preliminar';
  const balanza = balanzaDelMes(sumas, estado.lista?.codigos ?? new Map());
  const rutas = rutasDelPaquete(
    'recibidas',
    recibidas.map((r) => r.nombre),
  );
  return {
    nombre: nombreDelPaquete(mes, tipo),
    tipo,
    archivos: [
      { ruta: nombreDeLaBalanza(mes), contenido: balanzaCsv(balanza) },
      { ruta: 'emitidas.csv', contenido: emitidasCsv(emitidas) },
      ...recibidas.map((r, i) => ({ ruta: rutas[i] ?? `recibidas/${i}`, contenido: r.xml })),
      ...comprobantes,
    ],
  };
}
