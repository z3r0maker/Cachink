import { describe, expect, it } from 'vitest';
import { initI18n, i18n } from '../../src/i18n/index';
import {
  utilidadNetaVerdict,
  utilidadBrutaVerdict,
  utilidadOperativaVerdict,
} from '../../src/screens/Estados/health-verdicts';

initI18n();
const t = (key: string): string => i18n.t(key);

describe('utilidadNetaVerdict', () => {
  it('positive → healthy', () => {
    const result = utilidadNetaVerdict(10_000n, t);
    expect(result.tone).toBe('healthy');
    expect(result.verdict).toContain('rentable');
  });

  it('zero → warning', () => {
    const result = utilidadNetaVerdict(0n, t);
    expect(result.tone).toBe('warning');
    expect(result.verdict).toContain('cero');
  });

  it('negative → critical', () => {
    const result = utilidadNetaVerdict(-5_000n, t);
    expect(result.tone).toBe('critical');
    expect(result.verdict).toContain('pérdida');
  });
});

describe('utilidadBrutaVerdict', () => {
  it('negative → critical with selling-below-cost message', () => {
    const result = utilidadBrutaVerdict(-1_000n, t);
    expect(result).not.toBeNull();
    expect(result!.tone).toBe('critical');
    expect(result!.verdict).toContain('vendiendo por debajo');
  });

  it('positive → null (no special verdict)', () => {
    const result = utilidadBrutaVerdict(5_000n, t);
    expect(result).toBeNull();
  });

  it('zero → null', () => {
    const result = utilidadBrutaVerdict(0n, t);
    expect(result).toBeNull();
  });
});

describe('utilidadOperativaVerdict', () => {
  it('positive → healthy', () => {
    const result = utilidadOperativaVerdict(10_000n, t);
    expect(result.tone).toBe('healthy');
    expect(result.verdict).toContain('genera ganancia');
  });

  it('zero → critical', () => {
    const result = utilidadOperativaVerdict(0n, t);
    expect(result.tone).toBe('critical');
  });

  it('negative → critical', () => {
    const result = utilidadOperativaVerdict(-3_000n, t);
    expect(result.tone).toBe('critical');
    expect(result.verdict).toContain('consume');
  });
});
