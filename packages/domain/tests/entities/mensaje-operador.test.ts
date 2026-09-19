import { describe, it, expect } from 'vitest';
import { MensajeOperadorSchema } from '../../src/entities/index.js';

const BIZ_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEN';
const DEV_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TEP';
const MSG_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TMA';
const OP_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TMB';
const TURNO_ID = '01HZ8XQN9GZJXV8AKQ5X0C7TMC';

const validMensaje = {
  id: MSG_ID,
  operadorId: OP_ID,
  cajaTurnoId: TURNO_ID,
  severidad: 'aclaracion' as const,
  cuerpo: 'Aclara el corte del 13 de mayo',
  businessId: BIZ_ID,
  deviceId: DEV_ID,
  createdByUserId: OP_ID,
  createdAt: '2026-05-14T15:00:00.000Z',
  updatedAt: '2026-05-14T15:00:00.000Z',
  deletedAt: null,
};

describe('MensajeOperadorSchema', () => {
  it('accepts a well-formed aclaración with its turno reference', () => {
    expect(() => MensajeOperadorSchema.parse(validMensaje)).not.toThrow();
  });

  it('accepts an info notice without a turno', () => {
    expect(() =>
      MensajeOperadorSchema.parse({
        ...validMensaje,
        severidad: 'info',
        cajaTurnoId: null,
        cuerpo: 'La gringa sube a $65 desde mañana',
      }),
    ).not.toThrow();
  });

  it('rejects an unknown severity', () => {
    expect(() => MensajeOperadorSchema.parse({ ...validMensaje, severidad: 'urgente' })).toThrow();
  });

  it('rejects an empty body', () => {
    expect(() => MensajeOperadorSchema.parse({ ...validMensaje, cuerpo: '' })).toThrow();
  });

  it('rejects a missing operadorId', () => {
    const { operadorId: _drop, ...sinOperador } = validMensaje;
    expect(() => MensajeOperadorSchema.parse(sinOperador)).toThrow();
  });

  it('rejects a malformed cajaTurnoId', () => {
    expect(() =>
      MensajeOperadorSchema.parse({ ...validMensaje, cajaTurnoId: 'turno-13' }),
    ).toThrow();
  });
});
