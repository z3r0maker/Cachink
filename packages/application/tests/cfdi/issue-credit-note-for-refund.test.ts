/**
 * IssueCreditNoteForRefundUseCase (N-33) — the CFDI de egreso for a partial
 * refund, or for a refund of a payment inside a stamped global CFDI.
 */

import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'vitest';

import {
  CfdiError,
  CfdiProviderUnavailableError,
  InMemoryIssuedCfdiRepository,
  IssueCreditNoteForRefundUseCase,
} from '../../src/cfdi/index.js';
import { FakePacProvider } from './support/fake-pac-provider.js';
import { ISSUER } from './support/fixtures.js';
import { GLOBAL_UUID, INVOICE, globalStamped, refundRecord } from './support/refund-records.js';

describe('IssueCreditNoteForRefundUseCase', () => {
  let repo: InMemoryIssuedCfdiRepository;
  let pac: FakePacProvider;
  let useCase: IssueCreditNoteForRefundUseCase;
  const input = (toDate: bigint, refundId = 're_1') => ({
    externalPaymentId: 'in_refund_1',
    refundId,
    refundedToDateCentavos: toDate,
  });

  beforeEach(() => {
    repo = new InMemoryIssuedCfdiRepository();
    pac = new FakePacProvider();
    useCase = new IssueCreditNoteForRefundUseCase(repo, pac, ISSUER);
  });

  it('credits a partial refund against the payment’s own CFDI', async () => {
    await repo.claim(refundRecord('stamped'));
    const result = await useCase.execute(input(5_000n));
    assert.equal(result.outcome, 'credited');
    const [sent] = pac.creditNotes;
    assert.ok(sent);
    assert.equal(sent.relatedUuid, INVOICE.uuid);
    assert.equal(sent.receptor.rfc, 'EKU9003173C9');
    assert.equal(sent.receptor.usoCfdi, 'G02');
    assert.equal(sent.concepto.totalCentavos, 5_000n);
    assert.equal(sent.formaPago, '04');
    const saved = await repo.findByPaymentId('in_refund_1');
    assert.equal(saved?.status, 'stamped');
    assert.deepEqual(saved?.creditNotes, [result.note]);
    assert.equal(result.note?.totalCentavos, 5_000n);
    assert.equal(result.note?.refundId, 're_1');
  });

  it('a second partial refund credits only its own part; a duplicate credits nothing', async () => {
    await repo.claim(refundRecord('stamped'));
    await useCase.execute(input(5_000n));
    const second = await useCase.execute(input(8_000n, 're_2'));
    assert.equal(pac.creditNotes[1]?.concepto.totalCentavos, 3_000n);
    assert.equal(second.record.creditNotes?.length, 2);
    const again = await useCase.execute(input(8_000n, 're_2'));
    assert.equal(again.outcome, 'already_credited');
    assert.equal(pac.creditNotes.length, 2);
  });

  it('a payment in a stamped global is credited to público en general', async () => {
    await repo.claim(refundRecord('in_global'));
    await repo.saveGlobal(globalStamped);
    await useCase.execute(input(19_900n));
    const sent = pac.creditNotes[0];
    assert.equal(sent?.relatedUuid, GLOBAL_UUID);
    assert.equal(sent?.receptor.rfc, 'XAXX010101000');
    assert.equal(sent?.receptor.usoCfdi, 'S01');
    assert.equal(sent?.receptor.codigoPostal, ISSUER.lugarExpedicion);
  });

  it('refuses a refund larger than the payment, or of nothing', async () => {
    await repo.claim(refundRecord('stamped'));
    for (const bad of [0n, 19_901n]) {
      await assert.rejects(useCase.execute(input(bad)), { code: 'CFDI_INVALID_REFUND' });
    }
    assert.equal(pac.creditNotes.length, 0);
  });

  it('refuses a payment with no CFDI to relate to', async () => {
    await repo.claim(refundRecord('pending_global'));
    await assert.rejects(useCase.execute(input(5_000n)), { code: 'CFDI_INVALID_REFUND' });
    await assert.rejects(
      useCase.execute({ ...input(5_000n), externalPaymentId: 'in_missing' }),
      CfdiError,
    );
  });

  it('a global that is not on record is not guessed', async () => {
    await repo.claim(refundRecord('in_global'));
    await assert.rejects(useCase.execute(input(5_000n)), { code: 'CFDI_RECORD_NOT_FOUND' });
  });

  it('a PAC failure saves no note, so the retry stamps it', async () => {
    await repo.claim(refundRecord('stamped'));
    pac.failNext('stampCreditNote', new CfdiProviderUnavailableError('503'));
    await assert.rejects(useCase.execute(input(5_000n)), CfdiProviderUnavailableError);
    assert.equal((await repo.findByPaymentId('in_refund_1'))?.creditNotes, undefined);
    assert.equal((await useCase.execute(input(5_000n))).outcome, 'credited');
  });
});
