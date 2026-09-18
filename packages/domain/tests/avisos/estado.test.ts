import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { AvisoTransicionError, transicionAviso } from '../../src/index.js';

describe('transicionAviso', () => {
  it('reading a new aviso marks it read; resolving or dismissing closes it', () => {
    assert.equal(transicionAviso('nuevo', 'leer'), 'leido');
    assert.equal(transicionAviso('leido', 'resolver'), 'listo');
    assert.equal(transicionAviso('nuevo', 'resolver'), 'listo');
    assert.equal(transicionAviso('leido', 'descartar'), 'descartado');
  });

  it('reading one already read is a no-op, not an error', () => {
    assert.equal(transicionAviso('leido', 'leer'), 'leido');
  });

  it('a closed aviso cannot be reopened by reading it', () => {
    assert.throws(() => transicionAviso('listo', 'leer'), AvisoTransicionError);
  });

  it('a resolved aviso cannot be dismissed, nor a dismissed one resolved', () => {
    assert.throws(() => transicionAviso('listo', 'descartar'), AvisoTransicionError);
    assert.throws(() => transicionAviso('descartado', 'resolver'), AvisoTransicionError);
  });

  it('an unknown state is refused', () => {
    assert.throws(() => transicionAviso('archivado' as never, 'leer'), AvisoTransicionError);
  });
});
