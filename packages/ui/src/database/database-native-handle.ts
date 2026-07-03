/**
 * Module-level registry for the native expo-sqlite database handle.
 *
 * The DatabaseProvider stores the handle after opening; the reset
 * function closes it before deleting the file. This breaks the
 * circular dependency between provider and reset modules.
 */
import type { SQLiteDatabase } from 'expo-sqlite';

let _handle: SQLiteDatabase | null = null;

/** Called by DatabaseProvider after openDatabaseSync. */
export function registerNativeHandle(db: SQLiteDatabase): void {
  _handle = db;
}

/** Called by nativeResetDatabase before deleteDatabaseAsync. */
export function closeNativeHandle(): void {
  if (!_handle) return;
  try {
    _handle.closeSync();
  } catch {
    // Already closed — safe to ignore for reset flow
  }
  _handle = null;
}
