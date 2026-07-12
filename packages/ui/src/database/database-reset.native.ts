import { deleteDatabaseAsync } from 'expo-sqlite';
import type { ResetDatabaseFn } from './database-reset';
import { closeNativeHandle } from './database-native-handle';

const DB_FILE_NAME = 'cachink.db';

export const nativeResetDatabase: ResetDatabaseFn = async () => {
  closeNativeHandle();
  await deleteDatabaseAsync(DB_FILE_NAME);
};
