import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'vitest';
import {
  ContadorError,
  CUENTAS_DEL_CATALOGO,
  type Codigos,
  type ListaDeCodigos,
  type ValidacionDeCodigos,
} from '@xangarro/domain/corp';

import {
  armarPaquete,
  guardarCodigos,
  leerEstadoDeCodigos,
  validarCodigos,
  type CodigosRepository,
  type FuentesDelPaquete,
} from '../../src/corp/index.js';

/** E-43: the contador's codes and the month's package (boards CD-10d, CD-10e). */
class FakeCodigos implements CodigosRepository {
  readonly guardadas: ListaDeCodigos[] = [];
  readonly validadas: ValidacionDeCodigos[] = [];
  async listas() {
    return [...this.guardadas];
  }
  async validaciones() {
    return [...this.validadas];
  }
  async guardar(l: { codigos: Codigos; founderId: string }) {
    const lista = {
      id: `l${this.guardadas.length + 1}`,
      codigos: l.codigos,
      capturadaPor: l.founderId,
      capturadaAt: new Date(Date.UTC(2026, 10, 14, this.guardadas.length)).toISOString(),
    };
    this.guardadas.push(lista);
    return lista;
  }
  async validar(v: { listaId: string; fecha: string; founderId: string }) {
    const hecha = {
      id: `v${this.validadas.length + 1}`,
      listaId: v.listaId,
      validadaEl: v.fecha,
      marcadaPor: v.founderId,
      marcadaAt: '2026-11-15T18:00:00.000Z',
    };
    this.validadas.push(hecha);
    return hecha;
  }
}

const completos = (): Record<string, string> =>
  Object.fromEntries(CUENTAS_DEL_CATALOGO.map((c, i) => [c, `${100 + i}.01`]));

const code = async (p: Promise<unknown>): Promise<string> => {
  try {
    await p;
  } catch (e) {
    assert.ok(e instanceof ContadorError, String(e));
    return e.code;
  }
  throw new Error('did not throw');
};

describe('códigos agrupadores (E-43)', () => {
  let repo: FakeCodigos;
  beforeEach(() => {
    repo = new FakeCodigos();
  });

  it('saves a partial list, and the state names what is missing', async () => {
    const l = await guardarCodigos(
      { codigos: repo },
      { codigos: { bancos: '102.01' }, founderId: 'f1' },
    );
    assert.equal(l?.codigos.get('bancos'), '102.01');
    const e = await leerEstadoDeCodigos(repo);
    assert.equal(e.faltan.length, 21);
    assert.equal(e.validacion, null);
  });

  it('saving the same codes again writes nothing, so a validation stands', async () => {
    const l = await guardarCodigos({ codigos: repo }, { codigos: completos(), founderId: 'f1' });
    assert.ok(l);
    await validarCodigos(
      { codigos: repo },
      { listaId: l.id, fecha: '2026-11-14', hoy: '2026-11-19', founderId: 'f2' },
    );
    assert.equal(
      await guardarCodigos({ codigos: repo }, { codigos: completos(), founderId: 'f2' }),
      null,
    );
    assert.equal((await leerEstadoDeCodigos(repo)).validacion?.validadaEl, '2026-11-14');
  });

  it('changing one code leaves the list unvalidated', async () => {
    const l = await guardarCodigos({ codigos: repo }, { codigos: completos(), founderId: 'f1' });
    assert.ok(l);
    await validarCodigos(
      { codigos: repo },
      { listaId: l.id, fecha: '2026-11-14', hoy: '2026-11-19', founderId: 'f1' },
    );
    await guardarCodigos(
      { codigos: repo },
      { codigos: { ...completos(), bancos: '102.02' }, founderId: 'f1' },
    );
    const e = await leerEstadoDeCodigos(repo);
    assert.equal(e.lista?.id, 'l2');
    assert.equal(e.validacion, null);
  });

  it('an empty form with no list writes nothing', async () => {
    assert.equal(
      await guardarCodigos({ codigos: repo }, { codigos: { bancos: ' ' }, founderId: 'f1' }),
      null,
    );
    assert.equal(repo.guardadas.length, 0);
  });

  it('refuses a malformed code and writes nothing', async () => {
    assert.equal(
      await code(guardarCodigos({ codigos: repo }, { codigos: { bancos: 'x' }, founderId: 'f1' })),
      'CODIGO_FORMATO',
    );
    assert.equal(repo.guardadas.length, 0);
  });

  it('refuses to validate an incomplete list', async () => {
    const l = await guardarCodigos(
      { codigos: repo },
      { codigos: { bancos: '102.01' }, founderId: 'f1' },
    );
    assert.ok(l);
    assert.equal(
      await code(
        validarCodigos(
          { codigos: repo },
          { listaId: l.id, fecha: '2026-11-14', hoy: '2026-11-19', founderId: 'f1' },
        ),
      ),
      'CODIGOS_INCOMPLETOS',
    );
    assert.equal(repo.validadas.length, 0);
  });

  it('refuses a validation dated after today', async () => {
    const l = await guardarCodigos({ codigos: repo }, { codigos: completos(), founderId: 'f1' });
    assert.ok(l);
    assert.equal(
      await code(
        validarCodigos(
          { codigos: repo },
          { listaId: l.id, fecha: '2026-11-20', hoy: '2026-11-19', founderId: 'f1' },
        ),
      ),
      'CODIGOS_FECHA_FUTURA',
    );
  });
});

const texto = (c: Uint8Array | string | undefined) => (typeof c === 'string' ? c : '');

function fuentes(over: Partial<FuentesDelPaquete> = {}): FuentesDelPaquete {
  return {
    codigos: new FakeCodigos(),
    sumas: async () => [
      { cuenta: 'bancos', tramo: 'mes', debe: 116_00n, haber: 0n },
      { cuenta: 'ingresos', tramo: 'mes', debe: 0n, haber: 100_00n },
      { cuenta: 'iva_trasladado', tramo: 'mes', debe: 0n, haber: 16_00n },
    ],
    cerrado: async () => true,
    emitidas: async () => [
      {
        uuid: 'AAAA',
        tipo: 'Factura',
        rfc: 'XAXX010101000',
        nombre: 'Cliente',
        fecha: '2026-10-03',
        total: 116_00n,
      },
    ],
    recibidas: async () => [
      { nombre: 'proveedor.xml', xml: new TextEncoder().encode('<cfdi/>') },
      { nombre: 'proveedor.xml', xml: new TextEncoder().encode('<cfdi2/>') },
    ],
    comprobantes: async () => [
      { nombre: 'acuse.pdf', leer: async () => new Uint8Array([1, 2, 3]) },
    ],
    ...over,
  };
}

describe('paquete para el contador (E-43)', () => {
  it('a closed month is final: balanza, emitidas, the XMLs and the acuses', async () => {
    const p = await armarPaquete(fuentes(), { mes: '2026-10', hoy: '2026-11-19' });
    assert.equal(p.nombre, 'mexia-2026-10-final.zip');
    assert.equal(p.tipo, 'final');
    assert.deepEqual(
      p.archivos.map((a) => a.ruta),
      [
        'balanza-2026-10.csv',
        'emitidas.csv',
        'recibidas/proveedor.xml',
        'recibidas/proveedor (2).xml',
        'acuses/acuse.pdf',
      ],
    );
    const balanza = texto(p.archivos[0]?.contenido);
    assert.match(balanza, /\r\n,Bancos,Deudora,0\.00,116\.00,0\.00,116\.00\r\n/);
    assert.match(texto(p.archivos[1]?.contenido), /AAAA,Factura/);
  });

  it('an open month is preliminar', async () => {
    const p = await armarPaquete(fuentes({ cerrado: async () => false }), {
      mes: '2026-10',
      hoy: '2026-11-19',
    });
    assert.equal(p.nombre, 'mexia-2026-10-preliminar.zip');
  });

  it('the balanza carries the codes saved so far', async () => {
    const codigos = new FakeCodigos();
    await codigos.guardar({ codigos: new Map([['bancos', '102.01']]), founderId: 'f1' });
    const p = await armarPaquete(fuentes({ codigos }), { mes: '2026-10', hoy: '2026-11-19' });
    assert.match(texto(p.archivos[0]?.contenido), /\r\n102\.01,Bancos,/);
  });

  it('refuses a month that has not ended', async () => {
    assert.equal(
      await code(armarPaquete(fuentes(), { mes: '2026-11', hoy: '2026-11-19' })),
      'PAQUETE_SIN_TERMINAR',
    );
  });

  it('refuses when an Expediente file is missing, rather than leave it out', async () => {
    const f = fuentes({
      comprobantes: async () => [{ nombre: 'acuse.pdf', leer: async () => null }],
    });
    assert.equal(
      await code(armarPaquete(f, { mes: '2026-10', hoy: '2026-11-19' })),
      'PAQUETE_ARCHIVO',
    );
  });

  it('refuses a month that is not one', async () => {
    assert.equal(
      await code(armarPaquete(fuentes(), { mes: 'octubre', hoy: '2026-11-19' })),
      'PAQUETE_MES',
    );
  });
});
