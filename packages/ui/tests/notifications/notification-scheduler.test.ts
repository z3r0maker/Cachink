/**
 * NotificationScheduler contract tests (ADR-026, S4-C10).
 */

import { describe, expect, it } from 'vitest';
import { InMemoryNotificationScheduler } from '../../src/notifications/notification-scheduler';
import { millisUntilNextTrigger } from '../../src/notifications/notification-scheduler.web';

describe('InMemoryNotificationScheduler', () => {
  it('requestPermission returns granted on first call after default', async () => {
    const s = new InMemoryNotificationScheduler();
    expect(await s.requestPermission()).toBe('granted');
  });

  it('scheduleDaily + cancelById round-trip', async () => {
    const s = new InMemoryNotificationScheduler();
    await s.scheduleDaily({
      id: 'stock-low',
      hour: 19,
      minute: 0,
      title: 'Stock bajo',
      body: '3 productos',
    });
    expect(s.scheduled.has('stock-low')).toBe(true);
    await s.cancelById('stock-low');
    expect(s.scheduled.has('stock-low')).toBe(false);
  });

  it('cancelAll clears every scheduled notification', async () => {
    const s = new InMemoryNotificationScheduler();
    await s.scheduleDaily({
      id: 'a',
      hour: 8,
      minute: 0,
      title: 'A',
      body: 'A',
    });
    await s.scheduleDaily({
      id: 'b',
      hour: 9,
      minute: 0,
      title: 'B',
      body: 'B',
    });
    await s.cancelAll();
    expect(s.scheduled.size).toBe(0);
  });

  it('scheduleDaily is idempotent by id — re-scheduling replaces', async () => {
    const s = new InMemoryNotificationScheduler();
    await s.scheduleDaily({
      id: 'stock-low',
      hour: 19,
      minute: 0,
      title: 'A',
      body: 'A',
    });
    await s.scheduleDaily({
      id: 'stock-low',
      hour: 20,
      minute: 30,
      title: 'B',
      body: 'B',
    });
    const scheduled = s.scheduled.get('stock-low');
    expect(scheduled?.hour).toBe(20);
    expect(scheduled?.minute).toBe(30);
  });

  it('cancelById on an unknown id is a no-op', async () => {
    const s = new InMemoryNotificationScheduler();
    await expect(s.cancelById('missing')).resolves.toBeUndefined();
  });
});

describe('millisUntilNextTrigger', () => {
  it('returns a positive delta for any hour/minute input', () => {
    const now = new Date(2026, 3, 24, 10, 0, 0); // local 10:00
    const delta = millisUntilNextTrigger(19, 0, now);
    expect(delta).toBeGreaterThan(0);
    expect(delta).toBeLessThanOrEqual(1000 * 60 * 60 * 24);
  });

  it('rolls over to tomorrow when the time has passed today', () => {
    const now = new Date(2026, 3, 24, 20, 0, 0); // local 20:00
    const delta = millisUntilNextTrigger(19, 0, now);
    expect(delta).toBeGreaterThan(1000 * 60 * 60 * 22);
  });
});
