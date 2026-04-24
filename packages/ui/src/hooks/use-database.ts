/**
 * `useDatabase` hook alias — re-exported from the database module so
 * consumers can write `import { useDatabase } from '@cachink/ui'` without
 * reaching into `./database` internals.
 *
 * The canonical definition lives in `../database/_internal.tsx`.
 */
export { useDatabase } from '../database/_internal';
