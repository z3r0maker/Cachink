/**
 * Module-level registry for the native expo-sqlite database handle.
 *
 * The DatabaseProvider stores the handle after opening; the reset
 * function closes it before deleting the file. This breaks the
 * circular dependency between provider and reset modules.
 *
 * The file is opened once per process. On Android, expo-sqlite (55) hands
 * a second `openDatabaseSync` of the same file the same native connection,
 * and collecting either JS wrapper closes it under the other: the survivor's
 * next query rejects with «NativeDatabase.prepareSync … NullPointerException»
 * (X-05). StrictMode's double effect opened it twice on every dev launch.
 */
import type { SQLiteDatabase } from 'expo-sqlite';

let _handle: SQLiteDatabase | null = null;
let _opening: Promise<unknown> | null = null;

/**
 * The database `open` produces, opened at most once: a second caller (the
 * StrictMode remount) gets the first open. A failed open is forgotten so
 * «Reintentar» opens again; {@link closeNativeHandle} forgets it too.
 */
export function openNativeOnce<T>(open: () => Promise<T>): Promise<T> {
  if (_opening === null) {
    const opening = open().catch((error: unknown) => {
      if (_opening === opening) _opening = null;
      throw error;
    });
    _opening = opening;
  }
  return _opening as Promise<T>;
}

/** Called by DatabaseProvider after openDatabaseSync. */
export function registerNativeHandle(db: SQLiteDatabase): void {
  _handle = db;
}

/** Called by nativeResetDatabase before deleteDatabaseAsync. */
export function closeNativeHandle(): void {
  _opening = null;
  if (!_handle) return;
  try {
    _handle.closeSync();
  } catch {
    // Already closed — safe to ignore for reset flow
  }
  _handle = null;
}
