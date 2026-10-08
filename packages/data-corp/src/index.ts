export { createCorpDb, type CorpDb } from './client.js';
export { findFounderByStaffId, listFounders, type Founder } from './queries/founders.js';
export { createCorpLedgerRepository } from './queries/ledger.js';
export { listProjects, type Project } from './queries/projects.js';
export * from './schema/index.js';
