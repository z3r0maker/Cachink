import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { hijo, hijos, leerXml, XmlInvalidoError } from '../../src/corp/facturas/xml.js';

describe('leerXml (E-11)', () => {
  it('reads elements by local name, their attributes and their children', () => {
    const raiz = leerXml(
      '﻿<?xml version="1.0" encoding="UTF-8"?>\n<!-- comentario -->' +
        '<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" Total="10.00">' +
        '<cfdi:Emisor Rfc="AAA010101AAA" Nombre=\'Tom &amp; Jerry &#233;&#x41;\'/>' +
        '<cfdi:Conceptos><cfdi:Concepto Descripcion="Uno"></cfdi:Concepto>' +
        '<cfdi:Concepto Descripcion="Dos"/></cfdi:Conceptos>' +
        '</cfdi:Comprobante>',
    );
    assert.equal(raiz.nombre, 'Comprobante');
    assert.equal(raiz.attrs.get('Total'), '10.00');
    assert.equal(raiz.attrs.has('xmlns:cfdi'), false);
    assert.equal(hijo(raiz, 'Emisor')?.attrs.get('Nombre'), 'Tom & Jerry éA');
    const conceptos = hijo(raiz, 'Conceptos');
    assert.deepEqual(
      hijos(conceptos, 'Concepto').map((c) => c.attrs.get('Descripcion')),
      ['Uno', 'Dos'],
    );
    assert.equal(hijo(raiz, 'Receptor'), undefined);
  });

  it('refuses a DOCTYPE, so no entity can be declared or expanded', () => {
    assert.throws(() => leerXml('<!DOCTYPE x [<!ENTITY a "aaaa">]><x a="&a;"/>'), XmlInvalidoError);
  });

  it('refuses an unknown entity reference', () => {
    assert.throws(() => leerXml('<x a="&nbsp;"/>'), XmlInvalidoError);
  });

  it('refuses tags that do not close or close out of order', () => {
    assert.throws(() => leerXml('<a><b></a></b>'), XmlInvalidoError);
    assert.throws(() => leerXml('<a><b/>'), XmlInvalidoError);
    assert.throws(() => leerXml('<a/><b/>'), XmlInvalidoError);
  });

  it('refuses something that is not XML', () => {
    assert.throws(() => leerXml('%PDF-1.7 binario'), XmlInvalidoError);
    assert.throws(() => leerXml('<a b=sin-comillas/>'), XmlInvalidoError);
    assert.throws(() => leerXml(''), XmlInvalidoError);
  });
});
