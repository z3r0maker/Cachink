'use server';

import {
  crearTarjeta,
  moverTarjeta,
  proponerValor,
  quitarDelPlan,
  usarCotizacion,
} from '@xangarro/application/corp';
import { pesosToCentavos } from '@xangarro/domain';
import { nombreTrimestre, plazoDeObjecion, type Accion } from '@xangarro/domain/corp';
import type { Route } from 'next';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { auditedMutation } from '../audited';
import { hoyEnMexico } from '../db/corp';
import { avisarAlOtroSocio } from '../empresa/aviso-socio';
import { failed } from '../empresa/fallas';
import { correoTerminada } from '../empresa/tablero-correo';
import { adjuntoDelForm, tableroDeps } from '../empresa/tablero-deps';
import { socioDe } from '../empresa/tablero-lectura';
import { hrefTablero } from '../empresa/tablero-view';
import { requireFounder } from '../founder';
import { field, type FormState } from './form-state';

/**
 * The Tablero's card writes (E-20, board CD-13c): a new card, a partner's
 * value, the quote, leaving the plan, and each move through review. Founders
 * only, each with its `staff_audit_log` row after the corp write; a card
 * finished reaches the other partner by email.
 */
const ACCIONES: readonly Accion[] = [
  'iniciar',
  'terminar',
  'aceptar',
  'objetar',
  'mediador',
  'resolver',
  'hacer',
];

const volver = (form: FormData, extra: { tarjeta?: string } = {}): never => {
  revalidatePath('/empresa', 'layout');
  redirect(hrefTablero(field(form, 't'), extra) as Route);
};

const MONTO_MAL: FormState = {
  ok: false,
  message: 'Escribe el monto en pesos, mayor a cero, como 30000.',
};

const monto = (form: FormData, name: string): bigint | null => {
  const v = pesosToCentavos(field(form, name));
  return v === null || v <= 0n ? null : v;
};

export async function crearTarjetaAction(_p: FormState, form: FormData): Promise<FormState> {
  try {
    const { founder } = await requireFounder();
    const tipo = field(form, 'tipo') === 'tarea' ? 'tarea' : 'entregable';
    const valor = tipo === 'tarea' ? null : monto(form, 'valor');
    if (tipo === 'entregable' && valor === null) return MONTO_MAL;
    const objetivo = field(form, 'objetivo');
    await auditedMutation(
      (id: string) => ({
        action: 'empresa.tablero_tarjeta_creada',
        payload: { tarjetaId: id, tipo },
      }),
      () =>
        crearTarjeta(tableroDeps(), {
          trimestre: field(form, 't'),
          tipo,
          titulo: field(form, 'titulo'),
          criterio: field(form, 'criterio'),
          responsable: socioDe(Number(field(form, 'responsable'))),
          vence: field(form, 'vence'),
          objetivoId: objetivo === '' ? null : objetivo,
          valor,
          socio: socioDe(founder.numero),
          hoy: hoyEnMexico(),
          founderId: founder.id,
        }),
    );
  } catch (error) {
    return failed(error, 'crearTarjeta');
  }
  return volver(form);
}

export async function proponerValorAction(_p: FormState, form: FormData): Promise<FormState> {
  const tarjetaId = field(form, 'tarjeta');
  try {
    const { founder } = await requireFounder();
    const valor = monto(form, 'valor');
    if (valor === null) return MONTO_MAL;
    await auditedMutation(
      { action: 'empresa.tablero_valor_propuesto', payload: { tarjetaId } },
      () =>
        proponerValor(tableroDeps(), {
          tarjetaId,
          socio: socioDe(founder.numero),
          valor,
          hoy: hoyEnMexico(),
          founderId: founder.id,
        }),
    );
  } catch (error) {
    return failed(error, 'proponerValor');
  }
  return volver(form, { tarjeta: tarjetaId });
}

export async function cotizacionAction(_p: FormState, form: FormData): Promise<FormState> {
  const tarjetaId = field(form, 'tarjeta');
  try {
    const { founder } = await requireFounder();
    const valor = monto(form, 'monto');
    if (valor === null) return MONTO_MAL;
    const hoy = hoyEnMexico();
    const titulo = `Tablero ${nombreTrimestre(field(form, 't'))} · cotización de «${field(form, 'titulo')}»`;
    const adjunto = await adjuntoDelForm(form, titulo, hoy, founder.id);
    await auditedMutation({ action: 'empresa.tablero_cotizacion', payload: { tarjetaId } }, () =>
      usarCotizacion(tableroDeps(), {
        tarjetaId,
        monto: valor,
        hoy,
        founderId: founder.id,
        adjunto,
      }),
    );
  } catch (error) {
    return failed(error, 'usarCotizacion');
  }
  return volver(form, { tarjeta: tarjetaId });
}

export async function quitarDelPlanAction(_p: FormState, form: FormData): Promise<FormState> {
  const tarjetaId = field(form, 'tarjeta');
  try {
    const { founder } = await requireFounder();
    await auditedMutation(
      { action: 'empresa.tablero_tarjeta_quitada', payload: { tarjetaId } },
      () =>
        quitarDelPlan(tableroDeps(), {
          tarjetaId,
          trimestre: field(form, 't'),
          hoy: hoyEnMexico(),
          founderId: founder.id,
        }),
    );
  } catch (error) {
    return failed(error, 'quitarDelPlan');
  }
  return volver(form);
}

/** The other partner's ten days start now: they hear it by email. */
async function avisarTerminada(
  founder: Parameters<typeof avisarAlOtroSocio>[0]['quien'],
  form: FormData,
  hoy: string,
): Promise<void> {
  const tarjeta = {
    id: field(form, 'tarjeta'),
    titulo: field(form, 'titulo'),
    trimestre: field(form, 't'),
  };
  await avisarAlOtroSocio({
    quien: founder,
    kind: 'corp-tablero-terminada',
    clave: tarjeta.id,
    correo: (url) =>
      correoTerminada(
        { ...tarjeta, plazo: plazoDeObjecion(hoy) },
        `Fundador ${founder.numero}`,
        url,
      ),
  });
}

export async function moverTarjetaAction(_p: FormState, form: FormData): Promise<FormState> {
  const tarjetaId = field(form, 'tarjeta');
  try {
    const { founder } = await requireFounder();
    const accion = ACCIONES.find((a) => a === field(form, 'accion'));
    if (accion === undefined) return { ok: false, message: 'Elige qué hacer con la tarjeta.' };
    const hoy = hoyEnMexico();
    const t = field(form, 't');
    const que = accion === 'resolver' ? 'resolución del mediador' : 'evidencia';
    const titulo = `Tablero ${nombreTrimestre(t)} · ${que} de «${field(form, 'titulo')}»`;
    const { result } = await auditedMutation(
      { action: `empresa.tablero_${accion}`, payload: { tarjetaId } },
      async () =>
        moverTarjeta(tableroDeps(), {
          tarjetaId,
          accion,
          socio: socioDe(founder.numero),
          hoy,
          enlace: field(form, 'enlace'),
          motivo: field(form, 'motivo'),
          aceptada: field(form, 'aceptada') === '' ? null : field(form, 'aceptada') === 'si',
          founderId: founder.id,
          adjunto: await adjuntoDelForm(form, titulo, hoy, founder.id),
        }),
    );
    if (result.tipo === 'terminada') await avisarTerminada(founder, form, hoy);
  } catch (error) {
    return failed(error, 'moverTarjeta');
  }
  return volver(form, { tarjeta: tarjetaId });
}
