/**
 * NotificationScheduler contract tests (ADR-026, S4-C10).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InMemoryNotificationScheduler } from '../../src/notifications/notification-scheduler';
import { millisUntilNextTrigger } from '../../src/notifications/notification-scheduler.web';

const sendNotification = vi.fn();
const isPermissionGranted = vi.fn();
const pedirPermiso = vi.fn();
vi.mock('@tauri-apps/plugin-notification', () => ({
  sendNotification: (...args: unknown[]) => sendNotification(...args),
  isPermissionGranted: () => isPermissionGranted(),
  requestPermission: () => pedirPermiso(),
}));

const { TauriNotificationScheduler } =
  await import('../../src/notifications/notification-scheduler.web');

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

  it('presentNow records the notification in the presented array', async () => {
    const s = new InMemoryNotificationScheduler();
    await s.presentNow({
      id: 'alert-1',
      title: 'Discrepancia de caja',
      body: 'Faltaron $50',
      payload: { actionRoute: '/caja-reportes', alertId: 'alert-1' },
    });
    expect(s.presented).toHaveLength(1);
    expect(s.presented[0]!.id).toBe('alert-1');
    expect(s.presented[0]!.title).toBe('Discrepancia de caja');
    expect(s.presented[0]!.payload).toEqual({
      actionRoute: '/caja-reportes',
      alertId: 'alert-1',
    });
  });

  it('presentNow accumulates multiple notifications', async () => {
    const s = new InMemoryNotificationScheduler();
    await s.presentNow({ id: 'a', title: 'A', body: 'Body A' });
    await s.presentNow({ id: 'b', title: 'B', body: 'Body B' });
    expect(s.presented).toHaveLength(2);
  });

  it('presentNow works without payload (optional)', async () => {
    const s = new InMemoryNotificationScheduler();
    await s.presentNow({ id: 'no-payload', title: 'T', body: 'B' });
    expect(s.presented[0]!.payload).toBeUndefined();
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

describe('TauriNotificationScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-27T12:00:00'));
    sendNotification.mockClear();
    isPermissionGranted.mockReset();
    pedirPermiso.mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('permission: already granted, granted on request, denied, and anything else is undetermined', async () => {
    const s = new TauriNotificationScheduler();
    isPermissionGranted.mockResolvedValue(true);
    expect(await s.requestPermission()).toBe('granted');

    isPermissionGranted.mockResolvedValue(false);
    pedirPermiso.mockResolvedValue('granted');
    expect(await s.requestPermission()).toBe('granted');

    pedirPermiso.mockResolvedValue('denied');
    expect(await s.requestPermission()).toBe('denied');

    pedirPermiso.mockResolvedValue('default');
    expect(await s.requestPermission()).toBe('undetermined');
  });

  it('presentNow hands the title and body to the plugin', async () => {
    const s = new TauriNotificationScheduler();
    await s.presentNow({ title: 'Stock bajo', body: '3 productos' });
    expect(sendNotification).toHaveBeenCalledWith({ title: 'Stock bajo', body: '3 productos' });
  });

  it('scheduleDaily fires at the next occurrence, reschedules for the next day, and a cancel stops it', async () => {
    const s = new TauriNotificationScheduler();
    await s.scheduleDaily({ id: 'stock-low', hour: 13, minute: 0, title: 'T', body: 'B' });

    await vi.advanceTimersByTimeAsync(60 * 60 * 1000 + 5);
    expect(sendNotification).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(24 * 60 * 60 * 1000 + 5);
    expect(sendNotification).toHaveBeenCalledTimes(2);

    await s.cancelById('stock-low');
    await vi.advanceTimersByTimeAsync(3 * 24 * 60 * 60 * 1000);
    expect(sendNotification).toHaveBeenCalledTimes(2);

    // Scheduling again under the same id replaces the timer, and cancelAll clears the rest.
    await s.scheduleDaily({ id: 'stock-low', hour: 13, minute: 0, title: 'T', body: 'B' });
    await s.scheduleDaily({ id: 'otro', hour: 14, minute: 0, title: 'T', body: 'B' });
    await s.cancelAll();
    await vi.advanceTimersByTimeAsync(3 * 24 * 60 * 60 * 1000);
    expect(sendNotification).toHaveBeenCalledTimes(2);
  });
});
