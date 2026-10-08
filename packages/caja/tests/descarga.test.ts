import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import {
  DESCARGA_INTERRUMPIDA,
  DESCARGANDO,
  fraccionDescarga,
  TERMINANDO_INVENTARIO,
  textoPaginas,
} from '../src/comun/descarga';

describe('the first download, in pages (DS-10)', () => {
  it('says where it stands', () => {
    assert.equal(textoPaginas({ pagina: 3, paginas: 7 }), '3 de 7');
    assert.equal(textoPaginas({ pagina: 3, paginas: null }), 'Página 3');
    assert.equal(textoPaginas(null), '');
  });

  it('fills the bar per page, and has no measure without an estimate', () => {
    assert.equal(fraccionDescarga({ pagina: 7, paginas: 7 }), 1);
    assert.equal(fraccionDescarga({ pagina: 3, paginas: 6 }), 0.5);
    assert.equal(fraccionDescarga({ pagina: 9, paginas: 7 }), 1);
    assert.equal(fraccionDescarga({ pagina: 2, paginas: null }), null);
    assert.equal(fraccionDescarga(null), 0);
  });

  it('words it as the boards do', () => {
    assert.equal(DESCARGANDO, 'Descargando los datos de tu negocio…');
    assert.equal(
      DESCARGA_INTERRUMPIDA,
      'Se interrumpió la descarga. Lo que ya bajó se queda; toca Reintentar.',
    );
    assert.equal(TERMINANDO_INVENTARIO, 'Terminando de descargar el inventario…');
  });
});
