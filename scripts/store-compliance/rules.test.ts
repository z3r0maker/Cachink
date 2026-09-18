import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { matchRules } from './rules';

/**
 * Rule fixtures. The "does not fire" cases are real strings from the app's
 * es-MX catalog: a POS is full of prices, payments and purchases that belong
 * to the shop's own customers, and none of them is in-app selling.
 */

const hits = (text: string): readonly string[] => matchRules(text, false);

describe('each rule fires on the copy it exists to catch', () => {
  const cases: ReadonlyArray<readonly [string, string]> = [
    ['Tu plan Freelancer incluye 50 registros.', 'store/plan-name'],
    ['Plan', 'store/plan-name'],
    ['Xangarrito', 'store/plan-name'],
    ['MiPyME Pro', 'store/plan-name'],
    ['Desde $199 al mes', 'store/price'],
    ['$1,990 MXN / año + IVA', 'store/price'],
    ['Mejora a Pro y registra sin límite', 'store/purchase-cta'],
    ['Renueva tu suscripción', 'store/purchase-cta'],
    ['Prueba gratis 14 días', 'store/purchase-cta'],
    ['Compra más dispositivos', 'store/purchase-cta'],
    ['Cambia tu plan en app.xangarro.mx.', 'store/web-link'],
    ['¿No tienes código? Entra a xangarro.mx.', 'store/web-link'],
    ['Visita https://example.com para más', 'store/web-url'],
    ['Código de activación', 'store/licensing'],
    ['Activar', 'store/licensing'],
    ['Este dispositivo necesita activarse de nuevo.', 'store/licensing'],
    ['Desbloquea todas las funciones', 'store/licensing'],
    ['Tu licencia venció', 'store/licensing'],
  ];
  for (const [text, rule] of cases) {
    it(`${rule}: "${text}"`, () => {
      assert.ok(hits(text).includes(rule), `expected ${rule}, got ${JSON.stringify(hits(text))}`);
    });
  }
});

describe('POS vocabulary does not fire', () => {
  const pos = [
    'Cobrar',
    'Precio de venta',
    'Pagar con tarjeta',
    'Método de pago',
    '¡Gracias por su compra!',
    'Compras inventario',
    'Costo de compra',
    'Pagos pendientes',
    '¿Puedes pagar lo que debes con lo que tienes?',
    'Si vendiste 50 pasteles a $100, tus ingresos son $5,000.',
    'Debe ser mayor a $0',
    'Anual',
    'veces/mes',
    'Envía datos de diagnóstico y errores para mejorar la app.',
    'Producto activo',
    'Planeación semanal',
    'Vincular este dispositivo a tu negocio',
    'Pídelo al dueño del negocio.',
  ];
  for (const text of pos) {
    it(`"${text}"`, () => assert.deepEqual(hits(text), []));
  }
});

describe('links', () => {
  it('allows a support e-mail on the domain', () => {
    assert.deepEqual(matchRules('mailto:soporte@xangarro.mx', true), []);
  });

  it('allows an API host that is not the portal', () => {
    assert.deepEqual(matchRules('https://api.xangarro.mx', true), []);
  });

  it('flags a bare portal URL even though it is a code token', () => {
    assert.deepEqual(matchRules('https://app.xangarro.mx', true), ['store/web-link']);
  });

  it('ignores a bare URL string that is configuration', () => {
    assert.deepEqual(matchRules('http://127.0.0.1:3000', true), []);
  });

  it('checks prose rules only on copy, not on lowercase enum tokens', () => {
    assert.deepEqual(matchRules('plan_limit', true), []);
    assert.deepEqual(matchRules('plan', true), []);
  });
});
