import { subirFacturas } from '../../src/corp/index.js';
import { FakeDocumentos } from './fake-agenda.js';
import { cfdiXml, RFC_MEXIA_PRUEBA, type CfdiDePrueba } from './cfdi-xml.js';
import { FakeFacturas, FakeSat } from './fake-facturas.js';
import { FakeLedger } from './fake-ledger.js';

/** E-11's shared scenario: one received invoice uploaded and waiting for review. */
export const A = 'AAAAAAAA-0000-4000-8000-000000000001';

export async function conSubida(o: CfdiDePrueba = {}) {
  const d = {
    facturas: new FakeFacturas(),
    sat: new FakeSat(),
    ledger: new FakeLedger(),
    documentos: new FakeDocumentos(),
    sha256: async () => 'c'.repeat(64),
    rfcMexia: async () => RFC_MEXIA_PRUEBA,
  };
  const texto = cfdiXml({ uuid: A, ...o });
  const contenido = new TextEncoder().encode(texto);
  await subirFacturas(d, {
    archivos: [{ nombre: 'contador.xml', contenido, texto }],
    founderId: 'f1',
  });
  return d;
}

export const seleccion = { uuid: A, categoria: 'administracion', projectId: null } as const;
export const ctx = { founderId: 'f1', hoy: '2026-10-29' };
export const cuenta = (
  lines: readonly { cuenta: string; debe: bigint; haber: bigint }[],
  c: string,
) => lines.find((l) => l.cuenta === c);
