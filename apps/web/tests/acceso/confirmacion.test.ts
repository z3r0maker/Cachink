import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  confirmar,
  corregir,
  enlaceDeConfirmacion,
  enviarConfirmacion,
  pasePendiente,
  reenviar,
  reenviarVencido,
} from '@/server/acceso/confirmacion';
import { trasCredencial } from '@/server/acceso/entrar';

import { cuenta, mundo } from './mundo';

/** A fresh signup: unconfirmed, holding a pass, with one email on its way. */
async function recienRegistrada() {
  const c = cuenta({ confirmed: false });
  const m = mundo([c]);
  const r = await trasCredencial(m.deps, c, 'password');
  assert.equal(r.kind, 'confirmar');
  const pase = r.kind === 'confirmar' ? r.pase : '';
  const token = m.correos[0]?.token ?? '';
  return { c, m, pase, token };
}

describe('enlaceDeConfirmacion', () => {
  it('a fresh link names the address and the business it opens', async () => {
    const { c, m, token } = await recienRegistrada();
    assert.deepEqual(await enlaceDeConfirmacion(m.deps, token), {
      estado: 'listo',
      email: c.email,
      negocio: 'Taquería Don Pedro',
    });
  });

  it('an expired link says so and masks the address', async () => {
    const { c, m, token } = await recienRegistrada();
    m.avanzar(24 * 3600 + 1);
    const view = await enlaceDeConfirmacion(m.deps, token);
    assert.equal(view.estado, 'vencido');
    assert.equal(
      view.estado === 'vencido' ? view.correo : '',
      `${c.email.charAt(0)}***@taqueria.test.mx`,
    );
  });

  it('a link retired by a newer email reads as expired, not as confirmed', async () => {
    const { m, pase, token } = await recienRegistrada();
    await reenviar(m.deps, pase);
    assert.equal((await enlaceDeConfirmacion(m.deps, token)).estado, 'vencido');
  });

  it('a spent link says the address is already confirmed', async () => {
    const { m, token } = await recienRegistrada();
    await confirmar(m.deps, token);
    assert.deepEqual(await enlaceDeConfirmacion(m.deps, token), { estado: 'usado' });
  });

  it('a made-up token is unknown', async () => {
    const { m } = await recienRegistrada();
    assert.deepEqual(await enlaceDeConfirmacion(m.deps, 'x'.repeat(43)), { estado: 'desconocido' });
  });
});

describe('confirmar', () => {
  it('confirms the address, opens the session and sends the welcome', async () => {
    const { c, m, pase, token } = await recienRegistrada();
    assert.deepEqual(await confirmar(m.deps, token), { kind: 'sesion' });
    assert.equal(c.confirmed, true);
    assert.equal(m.sesion.userId, c.id);
    assert.deepEqual(
      m.correos.map((x) => x.kind),
      ['confirmacion', 'bienvenida'],
    );
    assert.equal(await pasePendiente(m.deps, pase), null, 'the pass is retired');
  });

  it('works once', async () => {
    const { m, token } = await recienRegistrada();
    await confirmar(m.deps, token);
    assert.deepEqual(await confirmar(m.deps, token), { kind: 'enlace', estado: 'usado' });
    assert.equal(m.correos.filter((x) => x.kind === 'bienvenida').length, 1);
  });

  it('refuses an expired link and confirms nothing', async () => {
    const { c, m, token } = await recienRegistrada();
    m.avanzar(24 * 3600 + 1);
    assert.deepEqual(await confirmar(m.deps, token), { kind: 'enlace', estado: 'vencido' });
    assert.equal(c.confirmed, false);
    assert.equal(m.sesion.userId, null);
  });

  it('refuses a token that was never issued', async () => {
    const { m } = await recienRegistrada();
    assert.deepEqual(await confirmar(m.deps, 'y'.repeat(43)), {
      kind: 'enlace',
      estado: 'desconocido',
    });
  });
});

describe('reenviar', () => {
  it('sends another link to the pass holder, and the earlier link stops working', async () => {
    const { c, m, pase, token } = await recienRegistrada();
    assert.equal(await reenviar(m.deps, pase), 'enviado');
    assert.equal(m.correos.length, 2);
    assert.equal(m.correos[1]?.to, c.email);
    assert.deepEqual(await confirmar(m.deps, token), { kind: 'enlace', estado: 'vencido' });
    assert.deepEqual(await confirmar(m.deps, m.correos[1]?.token ?? ''), { kind: 'sesion' });
  });

  it('needs the pass: without it, or with a made-up one, nothing is sent', async () => {
    const { m } = await recienRegistrada();
    assert.equal(await reenviar(m.deps, undefined), 'sin-pase');
    assert.equal(await reenviar(m.deps, 'z'.repeat(43)), 'sin-pase');
    assert.equal(m.correos.length, 1);
  });

  it('stops at three emails per address in the window', async () => {
    const { m, pase } = await recienRegistrada();
    assert.equal(await reenviar(m.deps, pase), 'enviado');
    assert.equal(await reenviar(m.deps, pase), 'enviado');
    assert.equal(await reenviar(m.deps, pase), 'limite');
    assert.equal(m.correos.length, 3);
  });

  it('a pass is worth nothing once the address is confirmed', async () => {
    const { m, pase, token } = await recienRegistrada();
    await confirmar(m.deps, token);
    assert.equal(await reenviar(m.deps, pase), 'sin-pase');
  });
});

describe('reenviarVencido', () => {
  it('an expired link can ask for a new one, sent to its own account', async () => {
    const { c, m, token } = await recienRegistrada();
    m.avanzar(24 * 3600 + 1);
    assert.equal(await reenviarVencido(m.deps, token), 'enviado');
    assert.equal(m.correos.at(-1)?.to, c.email);
  });

  it('a link that still works does not need another', async () => {
    const { m, token } = await recienRegistrada();
    assert.equal(await reenviarVencido(m.deps, token), 'no');
  });

  it('a confirmed account gets no more confirmation emails', async () => {
    const { m, token } = await recienRegistrada();
    await confirmar(m.deps, token);
    assert.equal(await reenviarVencido(m.deps, token), 'no');
  });

  it('a made-up token sends nothing', async () => {
    const { m } = await recienRegistrada();
    assert.equal(await reenviarVencido(m.deps, 'q'.repeat(43)), 'no');
    assert.equal(m.correos.length, 1);
  });
});

describe('corregir', () => {
  it('moves an unconfirmed account to the right address and mails the link there', async () => {
    const { c, m, pase, token } = await recienRegistrada();
    const r = await corregir(m.deps, pase, '  Pedro@Taqueria-Buena.test.mx ');
    assert.deepEqual(r, { kind: 'ok', email: 'pedro@taqueria-buena.test.mx', enviado: true });
    assert.equal(c.email, 'pedro@taqueria-buena.test.mx');
    assert.equal(m.correos.at(-1)?.to, 'pedro@taqueria-buena.test.mx');
    assert.deepEqual(await confirmar(m.deps, token), { kind: 'enlace', estado: 'vencido' });
    assert.equal((await pasePendiente(m.deps, pase))?.email, 'pedro@taqueria-buena.test.mx');
  });

  it('refuses without the pass', async () => {
    const { c, m } = await recienRegistrada();
    const antes = c.email;
    assert.deepEqual(await corregir(m.deps, undefined, 'otro@x.test.mx'), { kind: 'sin-pase' });
    assert.equal(c.email, antes);
  });

  it('refuses something that is not an address', async () => {
    const { m, pase } = await recienRegistrada();
    assert.deepEqual(await corregir(m.deps, pase, 'pedro arroba taqueria'), { kind: 'correo' });
  });

  it('refuses an address another account has, without saying whose', async () => {
    const otra = cuenta();
    const c = cuenta({ confirmed: false });
    const m = mundo([c, otra]);
    const r = await trasCredencial(m.deps, c, 'password');
    const pase = r.kind === 'confirmar' ? r.pase : '';
    assert.deepEqual(await corregir(m.deps, pase, otra.email.toUpperCase()), { kind: 'ocupado' });
  });

  it('the same address again is just another email', async () => {
    const { c, m, pase } = await recienRegistrada();
    assert.deepEqual(await corregir(m.deps, pase, c.email), {
      kind: 'ok',
      email: c.email,
      enviado: true,
    });
    assert.equal(m.correos.length, 2);
  });

  it('stops after five corrections in the window', async () => {
    const { m, pase } = await recienRegistrada();
    for (let i = 0; i < 5; i++) {
      assert.equal((await corregir(m.deps, pase, `intento${i}@x.test.mx`)).kind, 'ok');
    }
    assert.deepEqual(await corregir(m.deps, pase, 'sexto@x.test.mx'), { kind: 'limite' });
  });
});

describe('enviarConfirmacion', () => {
  it('names the business in the email, or «tu negocio» when the account has none', async () => {
    const c = cuenta({ confirmed: false, negocio: null });
    const m = mundo([c]);
    const seen: string[] = [];
    const deps = {
      ...m.deps,
      mail: {
        ...m.deps.mail,
        confirmacion: async (x: { negocio: string }) => void seen.push(x.negocio),
      },
    };
    assert.equal(await enviarConfirmacion(deps, { ...c, nombre: null }), 'enviado');
    assert.deepEqual(seen, ['tu negocio']);
  });
});
