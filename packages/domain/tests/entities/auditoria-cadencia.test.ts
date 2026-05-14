import { describe, expect, it } from 'vitest';
import type { IsoDate } from '../../src/dates/index.js';
import { isAuditDue } from '../../src/entities/auditoria-cadencia.js';

describe('isAuditDue', () => {
  it('always due when no prior audit', () => {
    expect(isAuditDue({ tipo: 'semanal', diaSemana: 1 }, null, '2026-05-09' as IsoDate)).toBe(true);
  });

  it('semanal: due after 7 days', () => {
    expect(isAuditDue({ tipo: 'semanal', diaSemana: 1 }, '2026-05-01' as IsoDate, '2026-05-09' as IsoDate)).toBe(true);
  });

  it('semanal: not due within 7 days', () => {
    expect(isAuditDue({ tipo: 'semanal', diaSemana: 1 }, '2026-05-05' as IsoDate, '2026-05-09' as IsoDate)).toBe(false);
  });

  it('quincenal: due after 14 days', () => {
    expect(isAuditDue({ tipo: 'quincenal', diaSemana: 1 }, '2026-04-25' as IsoDate, '2026-05-09' as IsoDate)).toBe(true);
  });

  it('mensual: due after 28 days', () => {
    expect(isAuditDue({ tipo: 'mensual', dia: 1 }, '2026-04-01' as IsoDate, '2026-05-09' as IsoDate)).toBe(true);
  });

  it('personalizado: due after cadaDias', () => {
    expect(isAuditDue({ tipo: 'personalizado', cadaDias: 10 }, '2026-04-28' as IsoDate, '2026-05-09' as IsoDate)).toBe(true);
  });

  it('personalizado: not due before cadaDias', () => {
    expect(isAuditDue({ tipo: 'personalizado', cadaDias: 10 }, '2026-05-01' as IsoDate, '2026-05-09' as IsoDate)).toBe(false);
  });
});
