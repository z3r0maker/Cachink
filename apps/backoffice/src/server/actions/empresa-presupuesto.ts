'use server';

import {
  pedirGasto,
  prepararPresupuesto,
  responderPresupuesto,
  responderSolicitud,
  type PresupuestoDeps,
} from '@xangarro/application/corp';
import { createPresupuestoRepository, importesDeResultados } from '@xangarro/data-corp';
import { pesosToCentavos } from '@xangarro/domain';
import {
  CATEGORIAS_GASTO,
  ingresoPromedio,
  mesesDelLimite,
  totalMensual,
  ultimoDia,
  type CategoriaGasto,
  type Montos,
} from '@xangarro/domain/corp';
import type { Route } from 'next';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { auditedMutation } from '../audited';
import { hoyEnMexico, requireCorpDb } from '../db/corp';
import { avisarAlOtroSocio } from '../empresa/aviso-socio';
import { failed } from '../empresa/fallas';
import { correoPresupuesto, correoSolicitud } from '../empresa/presupuesto-correo';
import { hrefPresupuesto, parseVista } from '../empresa/presupuesto-view';
import { requireFounder } from '../founder';
import { field, type FormState } from './form-state';

/**
 * Presupuesto's writes (E-22, board CD-15e): prepare a quarter's budget and
 * answer one, ask for spending outside it and answer a request. Founders
 * only, each with its `staff_audit_log` row after the corp write; what waits
 * on the other founder reaches them by email.
 */
const deps = (): PresupuestoDeps => {
  const db = requireCorpDb();
  return {
    presupuesto: createPresupuestoRepository(db),
    async ingresoPromedio(mes) {
      const meses = mesesDelLimite(mes);
      const desde = `${meses[0] ?? mes}-01`;
      const importes = await importesDeResultados(db, desde, ultimoDia(meses.at(-1) ?? mes));
      return ingresoPromedio(importes, meses);
    },
  };
};

const volver = (form: FormData): never => {
  revalidatePath('/empresa', 'layout');
  redirect(hrefPresupuesto(parseVista(field(form, 'vista'))) as Route);
};

const MONTOS_MAL: FormState = {
  ok: false,
  message: 'Escribe un monto al mes para cada categoría, en pesos, como 8500.',
};

function montosDel(form: FormData): Montos | null {
  const m: Partial<Record<CategoriaGasto, bigint>> = {};
  for (const c of CATEGORIAS_GASTO) {
    const v = pesosToCentavos(field(form, `monto_${c}`) || '0');
    if (v === null) return null;
    m[c] = v;
  }
  return m as Montos;
}

export async function prepararPresupuestoAction(_p: FormState, form: FormData): Promise<FormState> {
  const trimestre = field(form, 'trimestre');
  try {
    const { founder } = await requireFounder();
    const montos = montosDel(form);
    if (montos === null) return MONTOS_MAL;
    await auditedMutation({ action: 'empresa.presupuesto_preparado', payload: { trimestre } }, () =>
      prepararPresupuesto(deps(), { trimestre, montos, founderId: founder.id, hoy: hoyEnMexico() }),
    );
    await avisarAlOtroSocio({
      quien: founder,
      correo: (url) => correoPresupuesto(trimestre, founder.nombre, totalMensual(montos), url),
      kind: 'corp-presupuesto',
      clave: trimestre,
    });
  } catch (error) {
    return failed(error, 'prepararPresupuesto');
  }
  return volver(form);
}

export async function responderPresupuestoAction(
  _p: FormState,
  form: FormData,
): Promise<FormState> {
  const id = field(form, 'id');
  const aprobar = field(form, 'respuesta') === 'aprobar';
  try {
    const { founder } = await requireFounder();
    await auditedMutation(
      {
        action: aprobar ? 'empresa.presupuesto_aprobado' : 'empresa.presupuesto_rechazado',
        payload: { id },
      },
      () => responderPresupuesto(deps(), { id, aprobar, founderId: founder.id }),
    );
  } catch (error) {
    return failed(error, 'responderPresupuesto');
  }
  return volver(form);
}

export async function pedirGastoAction(_p: FormState, form: FormData): Promise<FormState> {
  try {
    const { founder } = await requireFounder();
    const monto = pesosToCentavos(field(form, 'monto'));
    if (monto === null) return { ok: false, message: 'Escribe el monto en pesos, como 279.' };
    const { result: s } = await auditedMutation(
      (r: { id: string; automatica: boolean }) => ({
        action: 'empresa.gasto_pedido',
        payload: { id: r.id, automatica: r.automatica },
      }),
      () =>
        pedirGasto(deps(), {
          concepto: field(form, 'concepto'),
          categoria: field(form, 'categoria'),
          monto,
          founderId: founder.id,
          hoy: hoyEnMexico(),
        }),
    );
    if (!s.automatica) {
      await avisarAlOtroSocio({
        quien: founder,
        correo: (url) => correoSolicitud(s, founder.nombre, url),
        kind: 'corp-solicitud-gasto',
        clave: s.id,
      });
    }
  } catch (error) {
    return failed(error, 'pedirGasto');
  }
  return volver(form);
}

export async function responderSolicitudAction(_p: FormState, form: FormData): Promise<FormState> {
  const id = field(form, 'id');
  const aprobar = field(form, 'respuesta') === 'aprobar';
  try {
    const { founder } = await requireFounder();
    const texto = field(form, 'monto');
    const monto = texto === '' ? null : pesosToCentavos(texto);
    if (texto !== '' && monto === null) {
      return { ok: false, message: 'Escribe el monto que apruebas en pesos, como 3000.' };
    }
    await auditedMutation(
      {
        action: aprobar ? 'empresa.gasto_aprobado' : 'empresa.gasto_rechazado',
        payload: { id, otroMonto: monto !== null },
      },
      () => responderSolicitud(deps(), { id, aprobar, monto, founderId: founder.id }),
    );
  } catch (error) {
    return failed(error, 'responderSolicitud');
  }
  return volver(form);
}
