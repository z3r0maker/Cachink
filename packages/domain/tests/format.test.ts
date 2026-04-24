import { describe, it, expect } from 'vitest';
import {
  formatMoney,
  formatMoneyCompact,
  formatPesos,
  formatDate,
  formatDateLong,
  formatMonth,
} from '../src/format/index.js';
import { parseIsoDate } from '../src/dates/index.js';

/**
 * `Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })`
 * inserts a NARROW NO-BREAK SPACE (U+202F) between the symbol and the
 * digits on modern Node/V8 (CLDR 42+). Tests strip non-ASCII whitespace
 * before asserting so the suite is portable across runtimes that emit a
 * regular space.
 */
const stripWeirdWhitespace = (s: string): string =>
  s.replaceAll(/\s+/g, '').replaceAll('\u202F', '');

describe('formatMoney', () => {
  it('formats zero as $0.00', () => {
    expect(stripWeirdWhitespace(formatMoney(0n))).toBe('$0.00');
  });

  it('formats one peso (100 centavos) as $1.00', () => {
    expect(stripWeirdWhitespace(formatMoney(100n))).toBe('$1.00');
  });

  it('formats $1,234.56 with grouping separator', () => {
    expect(stripWeirdWhitespace(formatMoney(123_456n))).toBe('$1,234.56');
  });

  it('formats negative amounts with a leading minus', () => {
    // es-MX renders "-$1,234.56".
    const out = stripWeirdWhitespace(formatMoney(-123_456n));
    expect(out.startsWith('-')).toBe(true);
    expect(out).toContain('1,234.56');
  });

  it('pads centavos under 100 to two decimals', () => {
    expect(stripWeirdWhitespace(formatMoney(99n))).toBe('$0.99');
  });

  it('preserves a 2-decimal boundary like $10.50', () => {
    expect(stripWeirdWhitespace(formatMoney(1050n))).toBe('$10.50');
  });

  it('handles a 1-billion-peso ledger sentinel without precision loss', () => {
    const oneBillionPesos = 1_000_000_000_00n; // 1e9 pesos in centavos
    const out = stripWeirdWhitespace(formatMoney(oneBillionPesos));
    expect(out).toBe('$1,000,000,000.00');
  });

  it('handles a 10-trillion-peso sentinel — guards against future bigint→Number loss', () => {
    // 10 trillion pesos = 1e13 pesos = 1e15 centavos. Within MAX_SAFE_INTEGER.
    const tenTrillionPesos = 1_000_000_000_000_0n * 100n; // 1e15
    const out = stripWeirdWhitespace(formatMoney(tenTrillionPesos));
    // Exact digits should be preserved through the bigint→string→number path.
    expect(out).toContain('10,000,000,000,000.00');
  });
});

describe('formatMoneyCompact', () => {
  it('renders thousands using es-MX compact form', () => {
    // $1,200.00 → either "$1.2 mil" (es-MX traditional) or "$1.2k". Either is
    // acceptable; just assert the output starts with $ and contains "1.2".
    const out = stripWeirdWhitespace(formatMoneyCompact(1_200_00n));
    expect(out).toContain('$');
    expect(out).toContain('1.2');
  });

  it('renders the KPI sample ($8,450) without crashing', () => {
    const out = stripWeirdWhitespace(formatMoneyCompact(8_450_00n));
    expect(out.length).toBeGreaterThan(0);
    expect(out).toContain('$');
  });

  it('renders millions in compact form', () => {
    const out = stripWeirdWhitespace(formatMoneyCompact(1_500_000_00n));
    expect(out).toContain('$');
    expect(out).toContain('1.5');
  });
});

describe('formatPesos', () => {
  it('formats with thousand separators and no symbol', () => {
    expect(formatPesos(123_456n)).toBe('1,234.56');
  });

  it('formats negative amounts with a leading minus', () => {
    expect(formatPesos(-50n)).toBe('-0.50');
  });
});

describe('formatDate', () => {
  it('formats the canonical reference date as "23 abr 2026"', () => {
    const out = formatDate(parseIsoDate('2026-04-23'));
    // es-MX short months are lowercase 3-letter abbreviations.
    expect(out).toContain('23');
    expect(out).toContain('abr');
    expect(out).toContain('2026');
  });

  it('formats a January date with ene', () => {
    const out = formatDate(parseIsoDate('2026-01-01'));
    expect(out).toContain('1');
    expect(out).toContain('ene');
    expect(out).toContain('2026');
  });
});

describe('formatDateLong', () => {
  it('formats "jueves, 23 de abril de 2026" (canonical reference date)', () => {
    // 2026-04-23 is a Thursday → "jueves" in es-MX.
    const out = formatDateLong(parseIsoDate('2026-04-23'));
    expect(out).toContain('jueves');
    expect(out).toContain('abril');
    expect(out).toContain('2026');
  });

  it('formats a Sunday correctly', () => {
    // 2026-04-26 is a Sunday.
    const out = formatDateLong(parseIsoDate('2026-04-26'));
    expect(out).toContain('domingo');
  });

  it('formats a leap-day boundary (2024-02-29)', () => {
    const out = formatDateLong(parseIsoDate('2024-02-29'));
    expect(out).toContain('29');
    expect(out).toContain('febrero');
    expect(out).toContain('2024');
  });
});

describe('formatMonth', () => {
  it('formats "abril 2026" from "2026-04"', () => {
    expect(formatMonth('2026-04')).toContain('abril');
    expect(formatMonth('2026-04')).toContain('2026');
  });

  it('formats "diciembre 2026" from "2026-12"', () => {
    expect(formatMonth('2026-12')).toContain('diciembre');
  });

  it('throws TypeError on an invalid month like "2026-13"', () => {
    expect(() => formatMonth('2026-13')).toThrow(TypeError);
  });

  it('throws TypeError on a malformed input like "2026-4"', () => {
    expect(() => formatMonth('2026-4')).toThrow(TypeError);
  });
});
