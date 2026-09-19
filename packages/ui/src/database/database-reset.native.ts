import { deleteDatabaseAsync } from 'expo-sqlite';
import type { ResetDatabaseFn } from './database-reset';
import { closeNativeHandle } from './database-native-handle';
import { DB_FILE_NAME, LEGACY_DB_FILE_NAME } from './database-file.shared';

export const nativeResetDatabase: ResetDatabaseFn = async () => {
  closeNativeHandle();
  await deleteDatabaseAsync(DB_FILE_NAME);
  // A pre-rebrand file left behind by a failed adoption must not come back
  // on the next launch as "existing data" (ADR-056).
  await deleteDatabaseAsync(LEGACY_DB_FILE_NAME).catch(() => undefined);
};
