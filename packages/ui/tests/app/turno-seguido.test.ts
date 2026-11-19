/**
 * M-18 (ADR-071 §3, MvTurnoDeOtro): when the phone asks the newcomer whether
 * to continue or close the caja's open turno. Their own turno never asks; a
 * turno they chose to continue stops asking; a newer turno asks again.
 */
import { beforeEach, describe, expect, it } from 'vitest';

import { debeElegir, useTurnoSeguido } from '../../src/app/turno-seguido';

const TURNO_ANA = { id: 'T-ana', userId: 'ana' };

describe('debeElegir', () => {
  it('asks when someone else opened the caja’s turno', () => {
    expect(debeElegir(TURNO_ANA, 'toni', null)).toBe(true);
  });

  it('never asks on the operator’s own turno', () => {
    expect(debeElegir(TURNO_ANA, 'ana', null)).toBe(false);
  });

  it('does not ask with no open turno or nobody signed in', () => {
    expect(debeElegir(null, 'toni', null)).toBe(false);
    expect(debeElegir(TURNO_ANA, null, null)).toBe(false);
  });

  it('stops asking once this operator chose to continue this turno', () => {
    expect(debeElegir(TURNO_ANA, 'toni', { turnoId: 'T-ana', userId: 'toni' })).toBe(false);
  });

  it('asks again for another person, or for a newer turno', () => {
    expect(debeElegir(TURNO_ANA, 'beto', { turnoId: 'T-ana', userId: 'toni' })).toBe(true);
    expect(
      debeElegir({ id: 'T-nuevo', userId: 'ana' }, 'toni', { turnoId: 'T-ana', userId: 'toni' }),
    ).toBe(true);
  });
});

describe('useTurnoSeguido', () => {
  beforeEach(() => useTurnoSeguido.setState({ seguido: null }));

  it('remembers the turno the operator continues', () => {
    useTurnoSeguido.getState().seguir('T-ana', 'toni');
    expect(useTurnoSeguido.getState().seguido).toEqual({ turnoId: 'T-ana', userId: 'toni' });
  });
});
