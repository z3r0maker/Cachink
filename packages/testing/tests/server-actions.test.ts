import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { serverActionsIn, unguarded } from '../src/server-actions';

/**
 * The reader behind each app's «every server action is guarded» test (audit
 * F-03). These are the shapes it must tell apart; the apps' own tests run it
 * over the real files.
 */
const scan = (text: string, file = 'actions/x.ts') =>
  serverActionsIn(text, file, { tenantScopes: ['withTenant'] });

const GUARDS = ['requireMember'];
const open = (text: string) => unguarded(scan(text), GUARDS).map((a) => a.name);

describe('serverActionsIn', () => {
  it('reads nothing from a file without the directive', () => {
    assert.deepEqual(scan(`export async function leer(id: string) { return id; }`), []);
    assert.deepEqual(scan(`// a comment that says 'use server'\nexport const a = 1;`), []);
  });

  it('lists every exported function of a use-server file, whatever its form', () => {
    const names = scan(`'use server';
      export async function uno() {}
      export const dos = async () => {};
      async function tres() {}
      export { tres, tres as cuatro };
      export default async function () {}
      export type Forma = { a: string };
      export interface Otra { b: string }
    `).map((a) => a.name);
    assert.deepEqual(names.sort(), ['cuatro', 'default', 'dos', 'tres', 'uno']);
  });

  it('marks what it cannot read: a re-export, a star, a value', () => {
    const actions = scan(`'use server';
      export { ajena } from './otra';
      export * from './mas';
      export const LIMITE = 5;
    `);
    assert.deepEqual(
      actions.map((a) => [a.name, a.readable]),
      [
        ['ajena', false],
        ['*', false],
        ['LIMITE', false],
      ],
    );
  });

  it('finds a function that carries its own directive', () => {
    const actions = scan(
      `export default function Page() {
         async function enviar(form: FormData) { 'use server'; await guardar(form); }
         return null;
       }`,
      'app/page.tsx',
    );
    assert.deepEqual(
      actions.map((a) => [a.name, a.calls]),
      [['inline:enviar', ['guardar']]],
    );
  });

  it('follows helpers declared in the same file', () => {
    const [action] = scan(`'use server';
      const sesion = async () => requireMember('admin');
      async function negocio() { return (await sesion()).business_id; }
      export async function guardar() { return negocio(); }
    `);
    assert.deepEqual(action?.calls, ['negocio', 'requireMember', 'sesion']);
  });

  it('follows an object of ports whose member is the guard', () => {
    const [action] = scan(`'use server';
      const ports = { member: async (min) => requireMember(min), report: reportError };
      export async function listar() { return listarCon(ports); }
    `);
    assert.deepEqual(action?.calls, ['listarCon', 'requireMember']);
  });

  it('names the parameter a tenant scope was opened with', () => {
    const [helper, action] = scan(`'use server';
      export async function saldos(businessId: string) {
        return withTenant(businessId, (tx) => leer(tx));
      }
      export async function guardar(form: FormData) {
        const session = await requireMember('admin');
        return withTenant(session.business_id, (tx) => escribir(tx, form));
      }
    `);
    assert.deepEqual(helper?.tenantFromCaller, ['businessId']);
    assert.deepEqual(action?.tenantFromCaller, []);
  });
});

describe('unguarded', () => {
  it('passes an action that calls a guard, directly or through a local helper', () => {
    assert.deepEqual(
      open(`'use server';
        const sesion = async () => requireMember('admin');
        export async function uno() { await requireMember(); }
        export async function dos() { await sesion(); }
      `),
      [],
    );
  });

  it('catches the read helper exported «for the page» (the F-03 finding)', () => {
    assert.deepEqual(
      open(`'use server';
        export async function guardar() { await requireMember('admin'); }
        export async function saldosActuales(businessId: string) {
          return withTenant(businessId, (tx) => leer(tx));
        }
      `),
      ['saldosActuales'],
    );
  });

  it('catches an export it cannot read', () => {
    assert.deepEqual(open(`'use server';\nexport { ajena } from './otra';`), ['ajena']);
  });

  it('a guard named in a comment or a string is not a call', () => {
    assert.deepEqual(
      open(`'use server';
        // requireMember() is called by the page
        export async function leer() { return 'requireMember()'; }
      `),
      ['leer'],
    );
  });

  it('an inline wrapper is closed when the action it calls is', () => {
    const actions = [
      ...scan(`'use server';\nexport async function enviar() { await requireMember(); }`),
      ...scan(`function Page() { async function f() { 'use server'; await enviar(); } }`, 'p.tsx'),
      ...scan(`function Page() { async function g() { 'use server'; await otra(); } }`, 'q.tsx'),
    ];
    assert.deepEqual(
      unguarded(actions, GUARDS).map((a) => a.name),
      ['inline:g'],
    );
  });

  it('two actions of one name: a guarded one does not vouch for the other', () => {
    const actions = [
      ...scan(`'use server';\nexport async function leer() { await requireMember(); }`, 'a.ts'),
      ...scan(`'use server';\nexport async function leer() { return 1; }`, 'b.ts'),
      ...scan(`'use server';\nexport async function usa() { return leer(); }`, 'c.ts'),
    ];
    assert.deepEqual(
      unguarded(actions, GUARDS).map((a) => `${a.file}#${a.name}`),
      ['b.ts#leer', 'c.ts#usa'],
    );
  });
});
