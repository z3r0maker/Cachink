/**
 * How the caja names the owner: the first name, with the title the owner goes
 * by kept («Don Pepe», never «Don»), or «el dueño» when there is no name.
 */
import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { aDueno, nombreDueno, primerNombreDueno } from '../src/comun/dueno';

describe('nombreDueno', () => {
  it('keeps the first name of a plain name', () => {
    assert.equal(nombreDueno('Pedro Ramírez'), 'Pedro');
    assert.equal(nombreDueno('Lupita'), 'Lupita');
  });

  it('keeps a title with the name that follows it', () => {
    assert.equal(nombreDueno('Don Pepe'), 'Don Pepe');
    assert.equal(nombreDueno('Doña Lupe Hernández'), 'Doña Lupe');
    assert.equal(nombreDueno('Lic. Ana Torres'), 'Lic. Ana');
    assert.equal(nombreDueno('Ing. Luis'), 'Ing. Luis');
    assert.equal(nombreDueno('Sra Gómez'), 'Sra Gómez');
  });

  it('reads a title in any case and keeps it as typed', () => {
    assert.equal(nombreDueno('DOÑA Chuy'), 'DOÑA Chuy');
    assert.equal(nombreDueno('don pepe'), 'don pepe');
  });

  it('collapses stray spaces around and between the words', () => {
    assert.equal(nombreDueno('  Don   Pepe  Pérez '), 'Don Pepe');
  });

  it('keeps a lone title rather than inventing a name', () => {
    assert.equal(nombreDueno('Don'), 'Don');
  });

  it('does not mistake a name that starts like a title for one', () => {
    assert.equal(nombreDueno('Donato Ruiz'), 'Donato');
    assert.equal(nombreDueno('Dora Pérez'), 'Dora');
  });

  it('falls back to «el dueño» without a name', () => {
    assert.equal(nombreDueno(null), 'el dueño');
    assert.equal(nombreDueno(undefined), 'el dueño');
    assert.equal(nombreDueno('   '), 'el dueño');
  });
});

describe('primerNombreDueno', () => {
  it('carries the title, and null without a name', () => {
    assert.equal(primerNombreDueno('Don Pepe'), 'Don Pepe');
    assert.equal(primerNombreDueno(''), null);
  });
});

describe('aDueno', () => {
  it('reads naturally with a title', () => {
    assert.equal(aDueno(nombreDueno('Don Pepe')), 'a Don Pepe');
    assert.equal(aDueno(nombreDueno(null)), 'al dueño');
  });
});
