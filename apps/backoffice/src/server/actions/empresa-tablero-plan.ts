'use server';

import {
  actualizarAvance,
  crearObjetivo,
  enviarPlan,
  guardarClausula,
  marcarAvisoEnviado,
  responderPlan,
} from '@xangarro/application/corp';
import { buildAvisoPdf } from '@xangarro/application/corp-pdf';
import { fechaEnTexto, nombreTrimestre, textoDelAviso } from '@xangarro/domain/corp';
import type { Route } from 'next';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { auditedMutation } from '../audited';
import { hoyEnMexico } from '../db/corp';
import { avisarAlOtroSocio } from '../empresa/aviso-socio';
import { failed } from '../empresa/fallas';
import { correoPlan } from '../empresa/tablero-correo';
import { archivarEnExpediente, tableroDeps } from '../empresa/tablero-deps';
import { leerElTablero, socioDe } from '../empresa/tablero-lectura';
import { hrefTablero, type PanelTablero } from '../empresa/tablero-view';
import { requireFounder } from '../founder';
import { field, type FormState } from './form-state';

/**
 * The Tablero's plan, objectives and notice (E-20, board CD-13d): send and
 * answer the quarter's plan, type an objective and its progress, keep the
 * clause, and mark the notice sent, which files its PDF in the Expediente.
 */
const volver = (form: FormData, panel?: PanelTablero): never => {
  revalidatePath('/empresa', 'layout');
  redirect(hrefTablero(field(form, 't'), panel === undefined ? {} : { panel }) as Route);
};

const entero = (form: FormData, name: string): number => {
  const v = field(form, name);
  return /^\d+$/.test(v) ? Number(v) : Number.NaN;
};

export async function enviarPlanAction(_p: FormState, form: FormData): Promise<FormState> {
  try {
    const { founder } = await requireFounder();
    const trimestre = field(form, 't');
    await auditedMutation({ action: 'empresa.tablero_plan_enviado', payload: { trimestre } }, () =>
      enviarPlan(tableroDeps(), {
        trimestre,
        socio: socioDe(founder.numero),
        hoy: hoyEnMexico(),
        founderId: founder.id,
      }),
    );
    await avisarAlOtroSocio({
      quien: founder,
      kind: 'corp-tablero-plan',
      clave: trimestre,
      correo: (url) => correoPlan(trimestre, `Fundador ${founder.numero}`, url),
    });
  } catch (error) {
    return failed(error, 'enviarPlan');
  }
  return volver(form);
}

export async function responderPlanAction(_p: FormState, form: FormData): Promise<FormState> {
  try {
    const { founder } = await requireFounder();
    const trimestre = field(form, 't');
    const aprobar = field(form, 'respuesta') === 'aprobar';
    await auditedMutation(
      {
        action: aprobar ? 'empresa.tablero_plan_aprobado' : 'empresa.tablero_plan_rechazado',
        payload: { trimestre },
      },
      () =>
        responderPlan(tableroDeps(), {
          trimestre,
          socio: socioDe(founder.numero),
          aprobar,
          hoy: hoyEnMexico(),
          founderId: founder.id,
        }),
    );
  } catch (error) {
    return failed(error, 'responderPlan');
  }
  return volver(form);
}

export async function crearObjetivoAction(_p: FormState, form: FormData): Promise<FormState> {
  try {
    const { founder } = await requireFounder();
    const quien = field(form, 'quien');
    await auditedMutation(
      (id: string) => ({ action: 'empresa.tablero_objetivo_creado', payload: { objetivoId: id } }),
      () =>
        crearObjetivo(tableroDeps(), {
          trimestre: field(form, 't'),
          quien: quien === '1' || quien === '2' ? socioDe(Number(quien)) : null,
          titulo: field(form, 'titulo'),
          meta: entero(form, 'meta'),
          unidad: field(form, 'unidad'),
          hoy: hoyEnMexico(),
          founderId: founder.id,
        }),
    );
  } catch (error) {
    return failed(error, 'crearObjetivo');
  }
  return volver(form);
}

export async function avanceAction(_p: FormState, form: FormData): Promise<FormState> {
  try {
    const { founder } = await requireFounder();
    const objetivoId = field(form, 'objetivo');
    await auditedMutation({ action: 'empresa.tablero_avance', payload: { objetivoId } }, () =>
      actualizarAvance(tableroDeps(), {
        objetivoId,
        valor: entero(form, 'valor'),
        socio: socioDe(founder.numero),
        hoy: hoyEnMexico(),
        founderId: founder.id,
      }),
    );
  } catch (error) {
    return failed(error, 'actualizarAvance');
  }
  return volver(form);
}

export async function clausulaAction(_p: FormState, form: FormData): Promise<FormState> {
  try {
    const { founder } = await requireFounder();
    await auditedMutation(
      (id: string) => ({ action: 'empresa.tablero_clausula', payload: { clausulaId: id } }),
      () =>
        guardarClausula(tableroDeps(), {
          numero: field(form, 'numero'),
          texto: field(form, 'texto'),
          founderId: founder.id,
        }),
    );
  } catch (error) {
    return failed(error, 'guardarClausula');
  }
  return volver(form, 'aviso');
}

export async function marcarAvisoAction(_p: FormState, form: FormData): Promise<FormState> {
  try {
    const { founder } = await requireFounder();
    const trimestre = field(form, 't');
    const hoy = hoyEnMexico();
    const { nombres } = await leerElTablero(hoy, trimestre);
    const enviadoEl = field(form, 'enviadoEl');
    await auditedMutation(
      (a: { documentoId: string }) => ({
        action: 'empresa.tablero_aviso_enviado',
        payload: { trimestre, documentoId: a.documentoId },
      }),
      () =>
        marcarAvisoEnviado(tableroDeps(), {
          trimestre,
          socio: socioDe(founder.numero),
          enviadoEl,
          hoy,
          founderId: founder.id,
          async archivar(aviso) {
            const pdf = await buildAvisoPdf(textoDelAviso(aviso, nombres), fechaEnTexto(enviadoEl));
            const nombre = `aviso-incumplimiento-${trimestre}.pdf`;
            const titulo = `Aviso de incumplimiento del ${nombreTrimestre(trimestre)}`;
            return archivarEnExpediente(
              { nombre, mime: 'application/pdf', contenido: pdf },
              titulo,
              hoy,
              founder.id,
            );
          },
        }),
    );
  } catch (error) {
    return failed(error, 'marcarAviso');
  }
  return volver(form, 'aviso');
}
