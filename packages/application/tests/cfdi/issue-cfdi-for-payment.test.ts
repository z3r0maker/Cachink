/**
 * IssueCfdiForPaymentUseCase — individual (PUE / PPD + REP) vs global,
 * idempotent per external payment id.
 */

import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'vitest';
import {
  CfdiProviderRejectedError,
  CfdiProviderUnavailableError,
  InMemoryIssuedCfdiRepository,
  IssueCfdiForPaymentUseCase,
} from '../../src/cfdi/index.js';
import { FakePacProvider } from './support/fake-pac-provider.js';
import { ISSUER, makePayment, makeTenantFiscal } from './support/fixtures.js';

describe('IssueCfdiForPaymentUseCase', () => {
  let repo: InMemoryIssuedCfdiRepository;
  let pac: FakePacProvider;
  let useCase: IssueCfdiForPaymentUseCase;

  beforeEach(() => {
    repo = new InMemoryIssuedCfdiRepository();
    pac = new FakePacProvider();
    useCase = new IssueCfdiForPaymentUseCase(repo, pac, ISSUER);
  });

  describe('happy paths', () => {
    it('stamps an individual PUE CFDI for a card payment with complete fiscal data', async () => {
      const result = await useCase.execute({
        payment: makePayment(),
        tenantFiscal: makeTenantFiscal(),
      });
      assert.equal(result.outcome, 'stamped');
      assert.equal(result.alreadyProcessed, false);
      assert.equal(result.record.status, 'stamped');
      assert.equal(result.record.route, 'individual_pue');
      assert.equal(pac.invoices.length, 1);
      const request = pac.invoices[0]!;
      assert.equal(request.metodoPago, 'PUE');
      assert.equal(request.formaPago, '04');
      assert.equal(request.receptor.rfc, 'EKU9003173C9');
      assert.equal(request.idempotencyKey, 'cfdi:in_1QxYz:ingreso');
      assert.deepEqual(request.conceptos, [
        {
          claveProdServ: '81112106',
          claveUnidad: 'E48',
          descripcion: 'Suscripción Xangarro — plan xangarro, septiembre 2026',
          totalCentavos: 19_900n,
        },
      ]);
      assert.equal(pac.complements.length, 0);
    });

    it('uses forma de pago 28 for a debit card', async () => {
      await useCase.execute({
        payment: makePayment({ cardFunding: 'debit' }),
        tenantFiscal: makeTenantFiscal(),
      });
      assert.equal(pac.invoices[0]!.formaPago, '28');
    });

    it('stamps a PPD invoice plus a complemento de pago for SPEI', async () => {
      const result = await useCase.execute({
        payment: makePayment({ method: 'spei', cardFunding: undefined, totalCentavos: 39_900n }),
        tenantFiscal: makeTenantFiscal(),
      });
      assert.equal(result.record.route, 'individual_ppd');
      assert.equal(result.record.status, 'stamped');
      const invoice = pac.invoices[0]!;
      assert.equal(invoice.metodoPago, 'PPD');
      assert.equal(invoice.formaPago, '99');
      const rep = pac.complements[0]!;
      assert.equal(rep.formaPago, '03');
      assert.equal(rep.idempotencyKey, 'cfdi:in_1QxYz:pago');
      assert.deepEqual(rep.documentoRelacionado, {
        uuid: result.record.invoice!.uuid,
        numParcialidad: 1,
        saldoAnteriorCentavos: 39_900n,
        importePagadoCentavos: 39_900n,
        baseIvaCentavos: 34_397n,
      });
      assert.ok(result.record.complement);
    });

    it('accumulates into the global CFDI when fiscal data is missing or invalid', async () => {
      const missing = await useCase.execute({ payment: makePayment(), tenantFiscal: null });
      assert.equal(missing.outcome, 'accumulated_for_global');
      assert.equal(missing.record.status, 'pending_global');
      assert.equal(missing.record.period, '2026-09');
      assert.ok(missing.record.globalReasons?.includes('rfc_missing'));

      const invalid = await useCase.execute({
        payment: makePayment({ externalId: 'in_2', method: 'spei', cardFunding: undefined }),
        tenantFiscal: makeTenantFiscal({ rfc: 'XAXX010101000' }),
      });
      assert.equal(invalid.record.route, 'global');
      assert.equal(invalid.record.formaPago, '03');
      assert.deepEqual(invalid.record.globalReasons, ['rfc_generic']);
      assert.equal(pac.invoices.length, 0);
    });
  });

  describe('idempotency', () => {
    it('a duplicate webhook yields one CFDI', async () => {
      const input = { payment: makePayment(), tenantFiscal: makeTenantFiscal() };
      const first = await useCase.execute(input);
      const second = await useCase.execute(input);
      assert.equal(second.alreadyProcessed, true);
      assert.deepEqual(second.record, first.record);
      assert.equal(pac.invoices.length, 1);
    });

    it('concurrent duplicates yield one CFDI', async () => {
      const input = { payment: makePayment(), tenantFiscal: makeTenantFiscal() };
      const [a, b] = await Promise.all([useCase.execute(input), useCase.execute(input)]);
      assert.equal(a.record.invoice!.uuid, b.record.invoice!.uuid);
      assert.equal(pac.stampedCount, 1);
    });

    it('a retry after a failed REP stamps only the REP', async () => {
      const input = {
        payment: makePayment({ method: 'spei', cardFunding: undefined }),
        tenantFiscal: makeTenantFiscal(),
      };
      pac.failNext('stampPaymentComplement', new CfdiProviderUnavailableError('503'));
      await assert.rejects(useCase.execute(input), { code: 'CFDI_PROVIDER_UNAVAILABLE' });
      const partial = await repo.findByPaymentId('in_1QxYz');
      assert.equal(partial?.status, 'claimed');
      assert.ok(partial?.invoice);

      const retried = await useCase.execute(input);
      assert.equal(retried.record.status, 'stamped');
      assert.equal(pac.invoices.length, 1);
      assert.equal(pac.complements.length, 2);
      assert.equal(pac.stampedCount, 2);
    });

    it('a retry after a rejection re-reads the fiscal data (fixed → individual, still bad → global)', async () => {
      pac.failNext(
        'stampInvoice',
        new CfdiProviderRejectedError('invalid_customer', 'RFC no registrado'),
      );
      await assert.rejects(
        useCase.execute({ payment: makePayment(), tenantFiscal: makeTenantFiscal() }),
        CfdiProviderRejectedError,
      );
      const fixed = await useCase.execute({
        payment: makePayment(),
        tenantFiscal: makeTenantFiscal({ rfc: 'URE180429TM6' }),
      });
      assert.equal(fixed.record.receptor?.rfc, 'URE180429TM6');
      assert.equal(fixed.record.status, 'stamped');

      pac.failNext('stampInvoice', new CfdiProviderRejectedError('invalid_customer', 'no'));
      const payment = makePayment({ externalId: 'in_3' });
      await assert.rejects(useCase.execute({ payment, tenantFiscal: makeTenantFiscal() }));
      const toGlobal = await useCase.execute({ payment, tenantFiscal: {} });
      assert.equal(toGlobal.record.status, 'pending_global');
    });
  });

  describe('unhappy paths', () => {
    it('rejects a zero or negative amount', async () => {
      for (const totalCentavos of [0n, -100n]) {
        await assert.rejects(
          useCase.execute({ payment: makePayment({ totalCentavos }), tenantFiscal: null }),
          { code: 'CFDI_INVALID_PAYMENT' },
        );
      }
    });

    it('rejects a non-MXN payment', async () => {
      await assert.rejects(
        useCase.execute({ payment: makePayment({ currency: 'usd' }), tenantFiscal: null }),
        { code: 'CFDI_UNSUPPORTED_CURRENCY' },
      );
    });

    it('rejects a missing id, description or an invalid date', async () => {
      const bad = [
        makePayment({ externalId: '  ' }),
        makePayment({ description: '' }),
        makePayment({ paidAt: new Date('nope') }),
      ];
      for (const payment of bad) {
        await assert.rejects(useCase.execute({ payment, tenantFiscal: null }), {
          code: 'CFDI_INVALID_PAYMENT',
        });
      }
      assert.equal(await repo.findByPaymentId('in_1QxYz'), null);
    });

    it('propagates a PAC rejection and leaves the payment retryable', async () => {
      pac.failNext('stampInvoice', new CfdiProviderRejectedError('invalid_customer', 'RFC'));
      await assert.rejects(
        useCase.execute({ payment: makePayment(), tenantFiscal: makeTenantFiscal() }),
        { code: 'CFDI_PROVIDER_REJECTED' },
      );
      const record = await repo.findByPaymentId('in_1QxYz');
      assert.equal(record?.status, 'claimed');
      assert.equal(record?.invoice, undefined);
    });
  });
});
