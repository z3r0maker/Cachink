import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { scanServerActions, unguarded } from '@xangarro/testing/server-actions';
import { describe, it } from 'vitest';

/**
 * Every export of a `'use server'` file is an endpoint (audit F-03).
 *
 * Next gives each one an id and answers a POST for it from anyone, with any
 * arguments: «it is only imported by the page» is not a control. So each
 * export checks the session itself, or is named on one of the two lists below
 * with the reason it need not. A read helper for a page lives in a
 * `server-only` module instead, where it is not an endpoint at all.
 *
 * The finding: `saldosActuales(businessId)` and four more like it, exported
 * from actions files, ran `withTenant` on whatever id the caller sent.
 */
const SRC = path.resolve(import.meta.dirname, '../src');

/** `src/server/auth.ts`: both refuse a request with no session; `requireMember` also ranks the role. */
const GUARDS = ['requireMember', 'requireSession'];

/**
 * Open to any member, the read-only contador included, so they call
 * `readSession` and return on null instead of ranking a role. Read by hand:
 * each one answers «Inicia sesión para continuar.» without a session and takes
 * its business from the session. A new one is added here on purpose.
 */
const READS_SESSION: Readonly<Record<string, string>> = {
  'server/actions/asesor.ts#resumenParaCompartir': 'the month a member shares is their own',
  'server/actions/avisos-preferencias.ts#cambiarCanalAviso': 'a member’s own notification matrix',
  'server/actions/avisos.ts#avisosDelBell': 'the bell’s list, for whoever is signed in',
  'server/actions/empleados.ts#pagosDelEmpleado': 'a drawer’s history; the tenant scope bounds it',
  'server/actions/equipo-detalle.ts#cortesDelDispositivo': 'a drawer’s history, as above',
  'server/actions/equipo-detalle.ts#turnosDelOperador': 'a drawer’s history, as above',
  'server/actions/negocio-activo.ts#cambiarNegocio':
    'the id is a request: checked against the account’s memberships before the switch',
};

/**
 * Callable with no session, on purpose. Each says what stands in for one.
 * «Throttled» is `xangarro.throttle` per address and/or per IP; the four that
 * are not take a 256-bit single-use token from an emailed link.
 */
const PUBLIC: Readonly<Record<string, string>> = {
  'server/actions/auth.ts#login': 'the door. Throttled per address and per IP',
  'server/actions/auth.ts#logout': 'ends the caller’s own session; takes nothing',
  'server/actions/signup.ts#registrarse': 'the other door. Throttled per address and per IP',
  'server/actions/auth-links.ts#pedirEnlace': 'asks for an emailed link. Throttled per address/IP',
  'server/actions/auth-links.ts#restablecerContrasena': 'spends a reset link. Not throttled',
  'server/actions/auth-links.ts#entrarConEnlace': 'spends a magic link. Not throttled',
  'server/actions/cancelar-eliminacion.ts#cancelarEliminacion':
    'spends a deletion email’s link (ADR-136). Not throttled',
  'server/billing/cancel-link-actions.ts#confirmarCancelacionPorEnlace':
    'spends a renewal reminder’s link (ADR-132). Not throttled',
  'server/actions/arco.ts#enviarSolicitudArco':
    'the ARCO form is open to anyone (N-34). Throttled per IP',
  'server/billing/actions.ts#stripePublishableKey':
    'a publishable key is public by definition. No caller today',
};

const key = (a: { file: string; name: string }) => `${a.file}#${a.name}`;

/** Every `.ts`/`.tsx` under `src`, by its path from there. */
const sources = new Map(
  readdirSync(SRC, { recursive: true, encoding: 'utf8' })
    .filter((file) => /\.tsx?$/.test(file))
    .map((file) => [file.split(path.sep).join('/'), readFileSync(path.join(SRC, file), 'utf8')]),
);
const actions = scanServerActions(sources, { tenantScopes: ['withTenant'] });
const open = unguarded(actions, GUARDS);

describe('server actions are guarded (audit F-03)', () => {
  it('finds the action files at all', () => {
    assert.ok(actions.length > 50, `only ${actions.length} actions found under ${SRC}`);
  });

  it('every action checks the session, or is on a list that says why not', () => {
    const unexplained = open.map(key).filter((k) => !(k in READS_SESSION) && !(k in PUBLIC));
    assert.deepEqual(
      unexplained,
      [],
      'an export of a use-server file with no session check: guard the action, or move a ' +
        'read helper to a server-only module',
    );
  });

  it('no action takes the tenant from its caller', () => {
    const offenders = actions.filter((a) => a.tenantFromCaller.length > 0).map(key);
    assert.deepEqual(offenders, [], 'withTenant on a parameter: the tenant is the session’s');
  });

  it('what is listed as reading the session does read it', () => {
    const reads = new Set(open.filter((a) => a.calls.includes('readSession')).map(key));
    const wrong = Object.keys(READS_SESSION).filter((k) => !reads.has(k));
    assert.deepEqual(wrong, [], 'remove from READS_SESSION: guarded now, gone, or not reading');
  });

  it('the public list names only actions that exist and are in fact unguarded', () => {
    const names = new Set(open.map(key));
    const stale = Object.keys(PUBLIC).filter((k) => !names.has(k));
    assert.deepEqual(stale, [], 'remove these from PUBLIC: guarded now, or gone');
  });
});
