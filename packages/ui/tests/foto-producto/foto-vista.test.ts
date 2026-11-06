/**
 * The product photo's words and URIs (M-13): a row as a tile draws it, the
 * owner's portal as the sheets name it, and «Tomada el …».
 */
import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import type { ProductImage } from '@xangarro/domain';
import { comoFotoVista } from '../../src/foto-producto/fotos-context';
import { portalDe } from '../../src/foto-producto/foto-partes';
import { tomadaEl } from '../../src/foto-producto/foto-cambiar-sheet';

const row = (bytes: string | null): ProductImage =>
  ({
    id: '01HZ8XQN9GZJXV8AKQ5X0C7MGA',
    productoId: '01HZ8XQN9GZJXV8AKQ5X0C7TEZ',
    mime: 'image/webp',
    bytes,
    width: bytes === null ? null : 512,
    height: bytes === null ? null : 512,
    businessId: '01HZ8XQN9GZJXV8AKQ5X0C7TEN',
    deviceId: '01HZ8XQN9GZJXV8AKQ5X0C7TEP',
    createdByUserId: null,
    createdAt: '2026-11-03T12:00:00.000Z',
    updatedAt: '2026-11-03T12:00:00.000Z',
    deletedAt: null,
  }) as ProductImage;

describe('comoFotoVista', () => {
  it('a photo becomes a WebP data URI with its date and device', () => {
    const v = comoFotoVista(row('UklGRg=='));
    assert.equal(v?.uri, 'data:image/webp;base64,UklGRg==');
    assert.equal(v?.createdAt, '2026-11-03T12:00:00.000Z');
    assert.equal(v?.deviceId, '01HZ8XQN9GZJXV8AKQ5X0C7TEP');
  });

  it('a tombstone is no photo: the tile shows its icon', () => {
    assert.equal(comoFotoVista(row(null)), null);
  });
});

describe('portalDe', () => {
  it('names the owner with a capital', () => {
    assert.equal(portalDe('pedro'), 'el portal de Pedro');
  });

  it('says «del dueño» until the device knows the name', () => {
    assert.equal(portalDe('el dueño'), 'el portal del dueño');
    assert.equal(portalDe(''), 'el portal del dueño');
  });
});

describe('tomadaEl', () => {
  it('says the day in words, and the caja when it was this one', () => {
    assert.equal(
      tomadaEl('2026-11-03T12:00:00.000Z', 'Caja 1'),
      'Tomada el 3 de noviembre de 2026 en Caja 1',
    );
  });

  it('leaves the caja out when another phone took it', () => {
    assert.equal(tomadaEl('2026-11-03T12:00:00.000Z', null), 'Tomada el 3 de noviembre de 2026');
  });
});
