/**
 * OPFS persistence for the register's SQLite database (ADR-071 §4).
 *
 * sql.js is in-memory; the whole database is exported as bytes and written to
 * one OPFS file after every flush. A reload boots from those bytes — the O-02
 * spike proved the round trip in Chromium and WebKit, including the
 * `createWritable` path Safari needs a persistent context for.
 */

const DB_FILE = 'xangarro-register.sqlite3';

/** The bytes the register last persisted, or null on a first boot. */
export async function opfsRead(): Promise<Uint8Array | null> {
  const root = await navigator.storage.getDirectory();
  const handle = await root.getFileHandle(DB_FILE, { create: true });
  const file = await handle.getFile();
  if (file.size === 0) return null;
  return new Uint8Array(await file.arrayBuffer());
}

/** Persist the database bytes. Called after every write batch. */
export async function opfsWrite(bytes: Uint8Array): Promise<void> {
  const root = await navigator.storage.getDirectory();
  const handle = await root.getFileHandle(DB_FILE, { create: true });
  const writable = await handle.createWritable();
  await writable.write(new Blob([bytes.buffer as ArrayBuffer]));
  await writable.close();
}

/** Forget the database — re-linking starts a new device (ADR-071 §3). */
export async function opfsReset(): Promise<void> {
  const root = await navigator.storage.getDirectory();
  await root.removeEntry(DB_FILE).catch(() => undefined);
}
