/**
 * scrubPii tests (ADR-027, S4-C16).
 */

import { describe, expect, it } from 'vitest';
import { PII_FIELDS, scrubPii } from '../../src/telemetry/pii-scrubber';

describe('scrubPii', () => {
  it('strips every blocklisted field from event.extra', () => {
    const event = {
      extra: {
        concepto: 'Venta efectivo — Carla',
        nombre: 'Carla',
        nota: 'detalles privados',
        okField: 'keep-me',
      },
    };
    scrubPii(event);
    expect(event.extra.concepto).toBeUndefined();
    expect(event.extra.nombre).toBeUndefined();
    expect(event.extra.nota).toBeUndefined();
    expect(event.extra.okField).toBe('keep-me');
  });

  it('strips fields inside breadcrumb.data', () => {
    const event = {
      breadcrumbs: [
        {
          data: { email: 'alguien@ejemplo.com', metodo: 'Efectivo' },
        },
      ],
    };
    scrubPii(event);
    expect(event.breadcrumbs[0]!.data!.email).toBeUndefined();
    expect(event.breadcrumbs[0]!.data!.metodo).toBe('Efectivo');
  });

  it('strips fields inside contexts', () => {
    const event = {
      contexts: {
        ventas: { concepto: 'Pago cliente', id: 'abc' },
      },
    };
    scrubPii(event);
    expect(event.contexts.ventas?.concepto).toBeUndefined();
    expect(event.contexts.ventas?.id).toBe('abc');
  });

  it('leaves the event unchanged when no PII fields are present', () => {
    const event = { extra: { id: 'abc', count: 3 } };
    const out = scrubPii(event);
    expect(out.extra).toEqual({ id: 'abc', count: 3 });
  });

  it('PII_FIELDS includes the Cachink-specific field list', () => {
    for (const field of ['concepto', 'nombre', 'telefono', 'email', 'nota']) {
      expect(PII_FIELDS).toContain(field);
    }
  });
});
