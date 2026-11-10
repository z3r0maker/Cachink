import assert from 'node:assert/strict';
import { beforeEach, describe, it, vi } from 'vitest';

/**
 * The device token in the keychain (audit F-15e): new items are written
 * «after first unlock, this device only». «This device only» is what keeps
 * the token out of a backup or a transfer to another phone; «after first
 * unlock» keeps it readable when the screen locks with the app in front and
 * a sync in flight, which «when unlocked» would not. expo-secure-store
 * updates an existing item's value in place and leaves its accessibility as
 * it was, so the token an already-linked phone holds is moved to a new item
 * on first read, new item first: the phone is never without its token.
 *
 * The keychain here is a fake that keeps, per item, the value and the
 * accessibility it was created with, as iOS does. The numbers are
 * expo-secure-store's own (`ios/SecureStoreAccessible.swift`).
 */

const THIS_DEVICE_ONLY = 1; // afterFirstUnlockThisDeviceOnly
const WHEN_UNLOCKED_THIS_DEVICE_ONLY = 6;
const WHEN_UNLOCKED = 5;
const OLD = 'xangarro.deviceToken';
const NEW = 'xangarro.deviceToken.v2';

interface Item {
  value: string;
  accessible: number;
}

const { keychain, calls, failing } = vi.hoisted(() => ({
  keychain: new Map<string, Item>(),
  calls: [] as string[],
  failing: { set: false },
}));

vi.mock('expo-secure-store', () => ({
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 1,
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 6,
  getItemAsync: async (key: string) => {
    calls.push(`get ${key}`);
    return keychain.get(key)?.value ?? null;
  },
  setItemAsync: async (key: string, value: string, options?: { keychainAccessible?: number }) => {
    calls.push(`set ${key}`);
    if (failing.set) throw new Error('errSecInteractionNotAllowed');
    const existing = keychain.get(key);
    // SecItemAdd on a duplicate becomes SecItemUpdate: the value only.
    if (existing) existing.value = value;
    else keychain.set(key, { value, accessible: options?.keychainAccessible ?? 5 });
  },
  deleteItemAsync: async (key: string) => {
    calls.push(`delete ${key}`);
    keychain.delete(key);
  },
}));

const { secureDeviceTokenStore: store } = await import('../../src/shell/device-token-store');

beforeEach(() => {
  keychain.clear();
  calls.length = 0;
  failing.set = false;
});

describe('secureDeviceTokenStore', () => {
  it('writes a new link’s token for this device only', async () => {
    await store.set('tok-nuevo');
    assert.deepEqual(keychain.get(NEW), { value: 'tok-nuevo', accessible: THIS_DEVICE_ONLY });
    assert.equal(keychain.has(OLD), false);
    assert.equal(await store.get(), 'tok-nuevo');
  });

  it('keeps it readable once the screen locks: after first unlock, not when unlocked', async () => {
    await store.set('tok-nuevo');
    assert.notEqual(keychain.get(NEW)?.accessible, WHEN_UNLOCKED_THIS_DEVICE_ONLY);
    assert.notEqual(keychain.get(NEW)?.accessible, WHEN_UNLOCKED);
  });

  it('answers null on a phone that was never linked, writing nothing', async () => {
    assert.equal(await store.get(), null);
    assert.equal(keychain.size, 0);
    assert.equal(
      calls.some((c) => c.startsWith('set')),
      false,
    );
  });

  it('keeps the token of a phone linked before, and moves it on first read', async () => {
    keychain.set(OLD, { value: 'tok-viejo', accessible: WHEN_UNLOCKED });
    assert.equal(await store.get(), 'tok-viejo');
    assert.deepEqual(keychain.get(NEW), { value: 'tok-viejo', accessible: THIS_DEVICE_ONLY });
    assert.equal(keychain.has(OLD), false);
    assert.equal(await store.get(), 'tok-viejo');
  });

  it('writes the new item before it removes the old one', async () => {
    keychain.set(OLD, { value: 'tok-viejo', accessible: WHEN_UNLOCKED });
    await store.get();
    assert.ok(calls.indexOf(`set ${NEW}`) >= 0);
    assert.ok(calls.indexOf(`set ${NEW}`) < calls.indexOf(`delete ${OLD}`));
  });

  it('still answers the token when the move fails, and leaves it where it was', async () => {
    keychain.set(OLD, { value: 'tok-viejo', accessible: WHEN_UNLOCKED });
    failing.set = true;
    assert.equal(await store.get(), 'tok-viejo');
    assert.deepEqual(keychain.get(OLD), { value: 'tok-viejo', accessible: WHEN_UNLOCKED });
    failing.set = false;
    assert.equal(await store.get(), 'tok-viejo');
    assert.equal(keychain.has(OLD), false);
  });

  it('linking again replaces the token and leaves no old item behind', async () => {
    keychain.set(OLD, { value: 'tok-viejo', accessible: WHEN_UNLOCKED });
    await store.set('tok-nuevo');
    assert.equal(await store.get(), 'tok-nuevo');
    assert.equal(keychain.has(OLD), false);
    assert.equal(keychain.get(NEW)?.accessible, THIS_DEVICE_ONLY);
  });

  it('clears both items: a wiped or revoked phone holds no token', async () => {
    keychain.set(OLD, { value: 'tok-viejo', accessible: WHEN_UNLOCKED });
    keychain.set(NEW, { value: 'tok-nuevo', accessible: THIS_DEVICE_ONLY });
    await store.clear();
    assert.equal(keychain.size, 0);
    assert.equal(await store.get(), null);
  });
});
