import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import {
  APERTURA_MOTIVO,
  classifyMovementOrigin,
  DEFAULT_USAGE_TIME_ZONE,
  PORTAL_DEVICE_ID,
} from '@xangarro/domain/usage';

/**
 * `0010_usage_counts.sql` carries the grants and the original body; 0025
 * replaces the body (apertura never counts, N-17). Rules are asserted over
 * the pair; `usage-counts.integration.test.ts` proves the same on real
 * Postgres against `computeUsage`. 0035 replaces the body again (one
 * transaction per ticket, ADR-073) and is checked on its own below.
 */
const code = (
  readFileSync(new URL('../drizzle/0010_usage_counts.sql', import.meta.url), 'utf8') +
  readFileSync(new URL('../drizzle/0025_opening_balances.sql', import.meta.url), 'utf8')
).replace(/--.*$/gm, '');

describe('usage_counts SQL (0010, body replaced by 0025)', () => {
  it('places rows in months by the domain’s time zone', () => {
    assert.ok(code.includes(`AT TIME ZONE '${DEFAULT_USAGE_TIME_ZONE}'`));
  });

  it('excludes exactly the movements classifyMovementOrigin does not count', () => {
    assert.ok(code.includes(`im.device_id = '${PORTAL_DEVICE_ID}'`));
    // 0025: apertura movements never count (N-17) — same rule as the domain.
    assert.match(code, /im\.motivo <> 'Apertura de inventario'/);
    assert.equal(
      classifyMovementOrigin({ motivo: APERTURA_MOTIVO, deviceId: PORTAL_DEVICE_ID }),
      'apertura',
    );
    assert.equal(classifyMovementOrigin({ motivo: 'Venta', deviceId: PORTAL_DEVICE_ID }), 'portal');
    assert.match(code, /im\.motivo NOT IN \('Venta', 'Conversión'\)/);
    assert.match(code, /im\.motivo = 'Devolución de cliente'/);
    assert.match(code, /starts_with\(coalesce\(im\.nota, ''\), 'Cancelación de venta:'\)/);
    assert.equal(classifyMovementOrigin({ motivo: 'Venta' }), 'venta');
    assert.equal(classifyMovementOrigin({ motivo: 'Conversión' }), 'conversion');
    const cancel = { motivo: 'Devolución de cliente', nota: 'Cancelación de venta: V-1' };
    assert.equal(classifyMovementOrigin(cancel), 'cancelacion');
    assert.equal(classifyMovementOrigin({ motivo: 'Devolución de cliente' }), 'manual');
  });

  it('does not un-count soft-deleted transactions', () => {
    const tx = code.slice(code.indexOf('tx AS ('), code.indexOf('tx_n AS ('));
    assert.doesNotMatch(tx, /deleted_at/);
  });

  it('runs as its caller and grants the metering role only SELECT on counted columns', () => {
    assert.match(code, /SECURITY INVOKER/);
    assert.doesNotMatch(code, /SECURITY DEFINER/);
    assert.doesNotMatch(code, /GRANT (INSERT|UPDATE|DELETE|ALL)/);
    const grants = [...code.matchAll(/GRANT SELECT (\([^)]*\)) ON public\.(\w+)\s+TO (\w+)/g)];
    assert.deepEqual(
      grants.map((g) => [g[2], g[1], g[3]]),
      [
        ['businesses', '(id, deleted_at)', 'xangarro_metering'],
        ['sales', '(business_id, created_at)', 'xangarro_metering'],
        ['expenses', '(business_id, created_at)', 'xangarro_metering'],
        [
          'inventory_movements',
          '(business_id, created_at, device_id, motivo, nota)',
          'xangarro_metering',
        ],
        ['products', '(business_id, created_at, deleted_at)', 'xangarro_metering'],
      ],
    );
  });
});

const tickets = readFileSync(
  new URL('../drizzle/0035_usage_counts_tickets.sql', import.meta.url),
  'utf8',
).replace(/--.*$/gm, '');

describe('usage_counts SQL (body replaced by 0035: one transaction per ticket)', () => {
  it('counts a ticket once and a ticketless line on its own, as countsTowardUsage does', () => {
    const tx = tickets.slice(tickets.indexOf('tx AS ('), tickets.indexOf('tx_n AS ('));
    assert.match(tx, /AND s\.ticket_id IS NOT NULL\s+GROUP BY s\.business_id, s\.ticket_id/);
    assert.match(tx, /AND s\.ticket_id IS NULL/);
    assert.doesNotMatch(tx, /deleted_at/);
  });

  it('keeps the invoker posture and grants the callers only the ticket column', () => {
    assert.match(tickets, /SECURITY INVOKER/);
    assert.doesNotMatch(tickets, /GRANT (INSERT|UPDATE|DELETE|ALL)/);
    const grants = [...tickets.matchAll(/GRANT SELECT (\([^)]*\)) ON public\.(\w+) TO (\w+)/g)];
    assert.deepEqual(
      grants.map((g) => [g[2], g[1], g[3]]),
      [
        ['sales', '(business_id, created_at, ticket_id)', 'xangarro_metering'],
        ['sales', '(ticket_id)', 'xangarro_admin'],
      ],
    );
  });
});
