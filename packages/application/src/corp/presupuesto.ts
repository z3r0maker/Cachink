import type { Money } from '@xangarro/domain';
import {
  assertPuedePedir,
  assertPuedePreparar,
  assertPuedeResponderPresupuesto,
  assertPuedeResponderSolicitud,
  cabeEnElLimite,
  limiteDeGasto,
  usadoDelLimite,
  type CategoriaGasto,
  type Montos,
  type Presupuesto,
  type SolicitudGasto,
} from '@xangarro/domain/corp';

/**
 * Presupuesto's writes (E-22, boards CD-15d and CD-15e): preparing a
 * quarter's budget and the other founder's answer, and asking for spending
 * outside it. A request inside its founder's Límite is approved on its own;
 * the repository decides that under a lock, so two requests at once cannot
 * both use what is left of it.
 */
export interface NuevaSolicitud {
  readonly periodo: string;
  readonly founderId: string;
  readonly concepto: string;
  readonly categoria: CategoriaGasto;
  readonly monto: Money;
}

export interface PresupuestoRepository {
  presupuestos(): Promise<readonly Presupuesto[]>;
  /** Returns the new budget's id. */
  preparar(p: {
    readonly trimestre: string;
    readonly montos: Montos;
    readonly founderId: string;
  }): Promise<string>;
  responder(id: string, kind: 'aprobado' | 'rechazado', founderId: string): Promise<void>;
  solicitudes(): Promise<readonly SolicitudGasto[]>;
  /**
   * Records a request in one transaction: `decidir` gets the founder's
   * requests of that month, read under a lock, and says whether it fits.
   */
  pedir(
    s: NuevaSolicitud,
    decidir: (delMes: readonly SolicitudGasto[]) => boolean,
  ): Promise<SolicitudGasto>;
  responderSolicitud(
    id: string,
    r: {
      readonly kind: 'aprobada' | 'rechazada';
      readonly monto: Money | null;
      readonly founderId: string;
    },
  ): Promise<void>;
}

export interface PresupuestoDeps {
  readonly presupuesto: PresupuestoRepository;
  /** The average income without IVA of the three whole months before `mes`. */
  readonly ingresoPromedio: (mes: string) => Promise<Money>;
}

export async function prepararPresupuesto(
  deps: Pick<PresupuestoDeps, 'presupuesto'>,
  input: {
    readonly trimestre: string;
    readonly montos: Montos;
    readonly founderId: string;
    readonly hoy: string;
  },
): Promise<string> {
  const presupuestos = await deps.presupuesto.presupuestos();
  assertPuedePreparar({ ...input, presupuestos });
  return deps.presupuesto.preparar(input);
}

export async function responderPresupuesto(
  deps: Pick<PresupuestoDeps, 'presupuesto'>,
  input: { readonly id: string; readonly aprobar: boolean; readonly founderId: string },
): Promise<Presupuesto> {
  const p = (await deps.presupuesto.presupuestos()).find((x) => x.id === input.id);
  const pedido = assertPuedeResponderPresupuesto(p, input.founderId);
  await deps.presupuesto.responder(
    input.id,
    input.aprobar ? 'aprobado' : 'rechazado',
    input.founderId,
  );
  return pedido;
}

export async function pedirGasto(
  deps: PresupuestoDeps,
  input: {
    readonly concepto: string;
    readonly categoria: string;
    readonly monto: Money;
    readonly founderId: string;
    readonly hoy: string;
  },
): Promise<SolicitudGasto> {
  const categoria = assertPuedePedir(input);
  const periodo = input.hoy.slice(0, 7);
  const limite = limiteDeGasto(await deps.ingresoPromedio(periodo));
  const s: NuevaSolicitud = {
    periodo,
    founderId: input.founderId,
    concepto: input.concepto.trim(),
    categoria,
    monto: input.monto,
  };
  return deps.presupuesto.pedir(s, (delMes) =>
    cabeEnElLimite({
      monto: s.monto,
      limite,
      usado: usadoDelLimite(delMes, s.founderId, periodo),
    }),
  );
}

/** The other founder's answer; `monto` approves less than was asked. */
export async function responderSolicitud(
  deps: Pick<PresupuestoDeps, 'presupuesto'>,
  input: {
    readonly id: string;
    readonly aprobar: boolean;
    readonly monto: Money | null;
    readonly founderId: string;
  },
): Promise<SolicitudGasto> {
  const s = (await deps.presupuesto.solicitudes()).find((x) => x.id === input.id);
  const otro = input.aprobar ? input.monto : null;
  const pedida = assertPuedeResponderSolicitud(s, input.founderId, otro);
  await deps.presupuesto.responderSolicitud(input.id, {
    kind: input.aprobar ? 'aprobada' : 'rechazada',
    monto: input.aprobar ? (otro ?? pedida.monto) : null,
    founderId: input.founderId,
  });
  return pedida;
}
