import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  descargarFactura,
  FacturaError,
  solicitarFacturaNominal,
  type CfdiMode,
  type FacturaRegistrada,
} from '../../src/cfdi/index.js';
import { RecordingSupportInbox, SupportInboxError } from '../../src/support-inbox/index.js';
import { FakePacProvider } from './support/fake-pac-provider.js';
import { registrada } from './support/facturas.js';
import { makeTenantFiscal } from './support/fixtures.js';

const rejectsWith = (p: Promise<unknown>, code: string) =>
  assert.rejects(p, (e: unknown) => e instanceof FacturaError && e.code === code);

function descarga(mode: CfdiMode, row: FacturaRegistrada = registrada(), providerId = 'pac_9') {
  let pacBuilt = 0;
  const deps = {
    mode,
    source: () => Promise.resolve([row]),
    providerIdOf: () => Promise.resolve(providerId),
    pac: () => {
      pacBuilt += 1;
      return new FakePacProvider();
    },
  };
  return { deps, pacBuilt: () => pacBuilt };
}

const pedir = { businessId: 'BIZ', paymentId: 'in_1' };

describe('descargarFactura', () => {
  it('test/live: the PDF and XML of a stamped payment come from the PAC', async () => {
    const { deps } = descarga('test');
    const pdf = await descargarFactura(deps, { ...pedir, formato: 'pdf' });
    assert.equal(pdf.contentType, 'application/pdf');
    assert.equal(pdf.filename, 'factura-xangarro-6F9619FF-8B86-D011-B42D-00C04FC964FF.pdf');
    assert.equal(new TextDecoder().decode(pdf.bytes), '%PDF pac_9');
    const xml = await descargarFactura(deps, { ...pedir, formato: 'xml' });
    assert.equal(new TextDecoder().decode(xml.bytes), '<cfdi id="pac_9"/>');
  });

  it('off: NO_DISPONIBLE, and no PAC is built', async () => {
    const h = descarga('off');
    await rejectsWith(descargarFactura(h.deps, { ...pedir, formato: 'pdf' }), 'NO_DISPONIBLE');
    assert.equal(h.pacBuilt(), 0);
  });

  it('a payment that is not timbrada, or issued by hand, has nothing to download', async () => {
    const pending = descarga('live', registrada({ estado: 'en_global' }));
    await rejectsWith(
      descargarFactura(pending.deps, { ...pedir, formato: 'xml' }),
      'NO_DISPONIBLE',
    );
    const manual = descarga('live', registrada({ emitidaManual: true }));
    await rejectsWith(descargarFactura(manual.deps, { ...pedir, formato: 'pdf' }), 'NO_DISPONIBLE');
  });

  it("another business's payment is NO_ENCONTRADA; a bad format is DATO_INVALIDO", async () => {
    const { deps } = descarga('live');
    await rejectsWith(
      descargarFactura(deps, { ...pedir, paymentId: 'in_x', formato: 'pdf' }),
      'NO_ENCONTRADA',
    );
    await rejectsWith(descargarFactura(deps, { ...pedir, formato: 'zip' }), 'DATO_INVALIDO');
  });

  it('no PAC document id on record → NO_DISPONIBLE', async () => {
    const h = descarga('live');
    const deps = { ...h.deps, providerIdOf: () => Promise.resolve(null) };
    await rejectsWith(descargarFactura(deps, { ...pedir, formato: 'pdf' }), 'NO_DISPONIBLE');
  });
});

function solicitud(row: FacturaRegistrada = registrada({ estado: 'en_global', ruta: 'global' })) {
  const inbox = new RecordingSupportInbox();
  const deps = { mode: 'off' as const, source: () => Promise.resolve([row]), inbox };
  return { deps, inbox };
}

describe('solicitarFacturaNominal', () => {
  it('en_global + valid fiscal data → one inbox item per payment, however often asked', async () => {
    const { deps, inbox } = solicitud();
    await solicitarFacturaNominal(deps, { ...pedir, fiscal: makeTenantFiscal() });
    await solicitarFacturaNominal(deps, { ...pedir, fiscal: makeTenantFiscal() });
    assert.equal(inbox.items.length, 1);
    const [item] = inbox.items;
    assert.equal(item?.kind, 'factura');
    assert.equal(item?.businessId, 'BIZ');
    assert.equal(item?.paymentRef, 'in_1');
    assert.equal(item?.sourceRef, 'nominal:in_1');
    assert.doesNotMatch(item?.body ?? '', /EKU9003173C9/, 'no fiscal data in the body');
  });

  it('a payment not in the global CFDI → NO_APLICA', async () => {
    const { deps, inbox } = solicitud(registrada());
    await rejectsWith(
      solicitarFacturaNominal(deps, { ...pedir, fiscal: makeTenantFiscal() }),
      'NO_APLICA',
    );
    assert.equal(inbox.items.length, 0);
  });

  it('incomplete or missing fiscal data → DATOS_FISCALES_INCOMPLETOS', async () => {
    const { deps, inbox } = solicitud();
    const noRfc = makeTenantFiscal({ rfc: null });
    await rejectsWith(
      solicitarFacturaNominal(deps, { ...pedir, fiscal: noRfc }),
      'DATOS_FISCALES_INCOMPLETOS',
    );
    await rejectsWith(
      solicitarFacturaNominal(deps, { ...pedir, fiscal: null }),
      'DATOS_FISCALES_INCOMPLETOS',
    );
    assert.equal(inbox.items.length, 0);
  });

  it('an unknown payment → NO_ENCONTRADA; a failed filing propagates', async () => {
    const { deps } = solicitud();
    await rejectsWith(
      solicitarFacturaNominal(deps, { ...pedir, paymentId: 'in_x', fiscal: makeTenantFiscal() }),
      'NO_ENCONTRADA',
    );
    const down = new SupportInboxError('INBOX_UNAVAILABLE', 'down', true);
    const failing = { ...deps, inbox: { file: () => Promise.reject(down) } };
    await assert.rejects(
      solicitarFacturaNominal(failing, { ...pedir, fiscal: makeTenantFiscal() }),
      down,
    );
  });
});
