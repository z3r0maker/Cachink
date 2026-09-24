import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  CfdiUuidSchema,
  SupportItemSchema,
  SupportAttachmentPathSchema,
} from '../../src/entities/support-item.js';

const ULID = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
const AT = '2026-09-17T12:00:00.000Z';
const UUID = '6F9619FF-8B86-D011-B42D-00C04FC964FF';

const bug = {
  id: ULID,
  kind: 'bug',
  status: 'nuevo',
  urgent: false,
  ownerStaffId: null,
  businessId: ULID,
  title: 'La venta no se guarda',
  body: 'Al tocar Guardar no pasa nada.',
  attachments: ['bug-reports/01HZ/captura.png'],
  source: 'bug-report',
  sourceRef: 'evt_123',
  paymentRef: null,
  cfdiUuid: null,
  dueAt: null,
  createdAt: AT,
  updatedAt: AT,
  resolvedAt: null,
};

const factura = { ...bug, kind: 'factura', paymentRef: 'in_1Q2w3E', attachments: [] };

const arco = {
  ...bug,
  kind: 'arco',
  attachments: [],
  businessId: null,
  dueAt: '2026-10-21T23:59:59-06:00',
};

describe('SupportItemSchema', () => {
  it('accepts an ARCO item with its deadline (N-34)', () => {
    assert.equal(SupportItemSchema.safeParse(arco).success, true);
  });

  it('refuses an ARCO item without a deadline, and a deadline on any other kind', () => {
    assert.equal(SupportItemSchema.safeParse({ ...arco, dueAt: null }).success, false);
    assert.equal(SupportItemSchema.safeParse({ ...bug, dueAt: arco.dueAt }).success, false);
    assert.equal(SupportItemSchema.safeParse({ ...arco, dueAt: '21/10/2026' }).success, false);
  });

  it('accepts a new bug item', () => {
    assert.equal(SupportItemSchema.safeParse(bug).success, true);
  });

  it('accepts a resolved factura item that carries its folio fiscal', () => {
    const resolved = { ...factura, status: 'resuelto', cfdiUuid: UUID, resolvedAt: AT };
    assert.equal(SupportItemSchema.safeParse(resolved).success, true);
  });

  it('rejects an unknown kind or status', () => {
    assert.equal(SupportItemSchema.safeParse({ ...bug, kind: 'otro' }).success, false);
    assert.equal(SupportItemSchema.safeParse({ ...bug, status: 'cerrado' }).success, false);
  });

  it('rejects a factura item without its payment reference', () => {
    assert.equal(SupportItemSchema.safeParse({ ...factura, paymentRef: null }).success, false);
  });

  it('rejects a resolved factura item without a CFDI UUID', () => {
    const resolved = { ...factura, status: 'resuelto', resolvedAt: AT };
    assert.equal(SupportItemSchema.safeParse(resolved).success, false);
  });

  it('rejects payment fields on an item that is not a factura', () => {
    assert.equal(SupportItemSchema.safeParse({ ...bug, paymentRef: 'in_1' }).success, false);
    assert.equal(SupportItemSchema.safeParse({ ...bug, cfdiUuid: UUID }).success, false);
  });

  it('rejects an empty title and a malformed source', () => {
    assert.equal(SupportItemSchema.safeParse({ ...bug, title: ' ' }).success, false);
    assert.equal(SupportItemSchema.safeParse({ ...bug, source: 'Bug Report' }).success, false);
  });
});

describe('CfdiUuidSchema', () => {
  it('accepts a folio fiscal and normalises it to upper case', () => {
    assert.equal(CfdiUuidSchema.parse(` ${UUID.toLowerCase()} `), UUID);
  });

  it('rejects anything that is not 8-4-4-4-12 hex', () => {
    for (const bad of [
      '',
      'ABC',
      UUID.slice(1),
      UUID.replace(/-/g, ''),
      `${UUID}0`,
      UUID.replace('F', 'G'),
    ]) {
      assert.equal(CfdiUuidSchema.safeParse(bad).success, false, bad);
    }
  });
});

describe('SupportAttachmentPathSchema', () => {
  it('accepts a relative storage path', () => {
    assert.equal(SupportAttachmentPathSchema.safeParse('migraciones/a/b.xlsx').success, true);
  });

  it('rejects absolute paths, traversal and URLs', () => {
    for (const bad of ['/etc/passwd', 'a/../b', 'https://x.mx/a.png', '']) {
      assert.equal(SupportAttachmentPathSchema.safeParse(bad).success, false, bad);
    }
  });
});
