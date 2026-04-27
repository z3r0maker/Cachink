import { deleteDatabaseAsync } from 'expo-sqlite';
import type { ResetDatabaseFn } from './database-reset';

const DB_FILE_NAME = 'cachink.db';

export const nativeResetDatabase: ResetDatabaseFn = async () => {
  await deleteDatabaseAsync(DB_FILE_NAME);
};
