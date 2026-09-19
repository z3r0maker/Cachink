import { describe, it, expect } from 'vitest';
import { RespuestaOperadorSchema } from '../../src/entities/index.js';

const BIZ_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEN';
const DEV_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEP';
const MSG_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TMA';
const RES_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TMD';
const OP_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TMB';

const validRespuesta = {
  id: RES_ID,
  mensajeId: MSG_ID,
  texto: 'Faltó cambio del billete de $500, ya lo tengo para hoy',
  businessId: BIZ_ID,
  deviceId: DEV_ID,
  createdByUserId: OP_ID,
  createdAt: '2026-05-14T18:30:00.000Z',
  updatedAt: '2026-05-14T18:30:00.000Z',
  deletedAt: null,
};

describe('RespuestaOperadorSchema', () => {
  it('accepts a well-formed reply', () => {
    expect(() => RespuestaOperadorSchema.parse(validRespuesta)).not.toThrow();
  });

  it('accepts a one-word reply', () => {
    expect(() =>
      RespuestaOperadorSchema.parse({ ...validRespuesta, texto: 'Enterado' }),
    ).not.toThrow();
  });

  it('rejects an empty texto', () => {
    expect(() => RespuestaOperadorSchema.parse({ ...validRespuesta, texto: '' })).toThrow();
  });

  it('rejects a missing mensajeId', () => {
    const { mensajeId: _drop, ...sinMensaje } = validRespuesta;
    expect(() => RespuestaOperadorSchema.parse(sinMensaje)).toThrow();
  });

  it('rejects a malformed mensajeId', () => {
    expect(() =>
      RespuestaOperadorSchema.parse({ ...validRespuesta, mensajeId: 'mensaje-1' }),
    ).toThrow();
  });
});
