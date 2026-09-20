/**
 * The runtime's shared types (O-06/O-12). `Db` is the Drizzle-on-sql.js
 * instance the Worker owns — structurally the `XangarroDatabase` every
 * repository and use case already takes, cast once at the Worker's edge
 * instead of at every call site.
 */

import type { drizzle } from 'drizzle-orm/sql-js';

export type Db = ReturnType<typeof drizzle>;
