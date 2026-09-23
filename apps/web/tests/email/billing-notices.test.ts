import assert from 'node:assert/strict';
import { describe, it, vi } from 'vitest';

import { InMemoryEmailSender, type OwnerRecipients } from '@xangarro/application/email';
import { computeEntitlement } from '@xangarro/application';

vi.mock('../../src/server/observability/report', () => ({ reportError: vi.fn() }));
vi.mock('../../src/server/billing/config', () => ({
  billingDb: () => {
    throw new Error('not in this test');
  },
  stripeClient: () => {
    throw new Error('not in this test');
  },
}));

const { paymentFailedEmailListener } = await import('../../src/server/email/payment-failed');
const { sendWelcome } = await import('../../src/server/email/welcome');
const { facturaIssuedEmailListener } = await import('../../src/server/email/factura-issued');

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
const NOW = new Date('2026-09-17T12:00:00.000Z');
const owners: OwnerRecipients = {
  of: (id) =>
    Promise.resolve(id === BIZ ? { email: 'pedro@taqueria.mx', name: 'Taquería Don Pedro' } : null),
};

describe('payment-failed listener (B-10 step 3, B-14)', () => {
  const notice = {
    businessId: BIZ,
    planId: 'xangarro' as const,
    periodStart: '2026-09-15T00:00:00.000Z',
    entitlement: computeEntitlement(
      BIZ,
      { planId: 'xangarro', status: 'past_due', currentPeriodEnd: '2026-09-15T00:00:00.000Z' },
      NOW,
    ),
  };

  it('emails the Stripe customer with the deadline and a per-period key', async () => {
    const sender = new InMemoryEmailSender();
    await paymentFailedEmailListener({ owners, sender, origin: 'https://p.test' }).onPaymentFailed(
      notice,
    );
    const [m] = sender.sent;
    assert.equal(m?.to, 'pedro@taqueria.mx');
    assert.equal(m?.subject, 'No pudimos cobrar tu suscripción a Xangarro');
    assert.match(m?.text ?? '', /Hola, Taquería Don Pedro:/);
    assert.match(m?.text ?? '', /21 de septiembre de 2026/, 'period start + 7 days, Mexico City');
    assert.match(m?.html ?? '', /https:\/\/p\.test\/suscripcion/);
    assert.equal(m?.idempotencyKey, `payment-failed:${BIZ}:2026-09-15`);
    assert.deepEqual(m?.tags, [{ name: 'kind', value: 'payment-failed' }]);
  });

  it('sends nothing for a business with no Stripe customer address', async () => {
    const sender = new InMemoryEmailSender();
    await paymentFailedEmailListener({ owners, sender }).onPaymentFailed({
      ...notice,
      businessId: 'nobody',
    });
    assert.equal(sender.sent.length, 0);
  });
});

describe('welcome (B-14)', () => {
  it('sends once per business, to the signup address, linking the checklist', async () => {
    const sender = new InMemoryEmailSender();
    const args = {
      to: 'pedro@taqueria.mx',
      name: 'Pedro',
      nombreNegocio: 'Taquería Don Pedro',
      businessId: BIZ,
      origin: 'https://p.test',
      sender,
    };
    await sendWelcome(args);
    await sendWelcome(args);
    assert.equal(sender.sent.length, 1, 'the in-memory sender keeps one per idempotency key');
    const [m] = sender.sent;
    assert.equal(m?.idempotencyKey, `welcome:${BIZ}`);
    assert.match(m?.html ?? '', /https:\/\/p\.test\/como-empiezo/);
    assert.match(m?.text ?? '', /Hola, Pedro:/);
  });
});

describe('factura-issued listener (B-14, N-33)', () => {
  const record = {
    externalPaymentId: 'in_1',
    tenantId: BIZ,
    route: 'individual_pue' as const,
    status: 'stamped' as const,
    totalCentavos: 23_084n,
    paidAt: new Date('2026-09-21T03:00:00.000Z'),
    period: '2026-09',
    formaPago: '04' as const,
    description: 'Suscripción Xangarro',
    invoice: { providerId: 'fp_1', uuid: '6A1B2C3D-4E5F-4A6B-8C7D-9E0F1A2B3C4D' },
  };

  it('prefers the receptor email from the fiscal data, keyed by the payment', async () => {
    const sender = new InMemoryEmailSender();
    await facturaIssuedEmailListener({ owners, sender }).onIssued({
      ...record,
      receptor: {
        rfc: 'XAXX010101000',
        nombre: 'TAQUERIA DON PEDRO',
        regimenFiscal: '612',
        usoCfdi: 'G03',
        codigoPostal: '06600',
        email: 'contador@taqueria.mx',
      },
    });
    const [m] = sender.sent;
    assert.equal(m?.to, 'contador@taqueria.mx');
    assert.equal(m?.idempotencyKey, 'factura-issued:in_1');
    assert.match(m?.text ?? '', /6A1B2C3D-4E5F-4A6B-8C7D-9E0F1A2B3C4D/);
    assert.match(m?.text ?? '', /\$230\.84/);
  });

  it('falls back to the Stripe customer, and sends nothing without a folio fiscal', async () => {
    const sender = new InMemoryEmailSender();
    const listener = facturaIssuedEmailListener({ owners, sender });
    await listener.onIssued(record);
    assert.equal(sender.sent[0]?.to, 'pedro@taqueria.mx');
    await listener.onIssued({ ...record, externalPaymentId: 'in_2', invoice: undefined });
    assert.equal(sender.sent.length, 1);
  });
});
