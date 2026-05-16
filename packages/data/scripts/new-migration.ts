#!/usr/bin/env tsx
/**
 * new-migration.ts — scaffold a new hand-written migration.
 *
 * Usage:
 *   pnpm db:new "add_payment_limits"
 *
 * What it does:
 *   1. Reads _journal.json to determine the next index.
 *   2. Creates a migration .ts file with a template.
 *   3. Appends an entry to _journal.json.
 *   4. Increments SCHEMA_VERSION in schema-version.ts.
 *   5. Regenerates the barrel index.ts.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(__dirname, '../drizzle/migrations');
const JOURNAL_PATH = resolve(MIGRATIONS_DIR, 'meta/_journal.json');
const SCHEMA_VERSION_PATH = resolve(
  __dirname,
  '../src/migrator/schema-version.ts',
);
const GEN_BARREL_SCRIPT = resolve(__dirname, 'gen-migration-barrel.ts');

interface JournalEntry {
  readonly idx: number;
  readonly version: string;
  readonly when: number;
  readonly tag: string;
  readonly breakpoints: boolean;
}

interface Journal {
  readonly version: string;
  readonly dialect: string;
  readonly entries: JournalEntry[];
}

function readJournal(): Journal {
  return JSON.parse(readFileSync(JOURNAL_PATH, 'utf-8')) as Journal;
}

function writeJournal(journal: Journal): void {
  writeFileSync(JOURNAL_PATH, JSON.stringify(journal, null, 2) + '\n', 'utf-8');
}

// Parse args
const name = process.argv[2];
if (!name) {
  console.error('Usage: pnpm db:new "migration_name"');
  console.error('Example: pnpm db:new "add_payment_limits"');
  process.exit(1);
}

// Sanitize name: lowercase, underscores only
const sanitized = name
  .toLowerCase()
  .replace(/[^a-z0-9_]/g, '_')
  .replace(/_+/g, '_')
  .replace(/^_|_$/g, '');

if (!sanitized) {
  console.error('❌ Migration name must contain at least one alphanumeric character.');
  process.exit(1);
}

const journal = readJournal();
const nextIdx = journal.entries.length;
const paddedIdx = String(nextIdx).padStart(4, '0');
const tag = `${paddedIdx}_${sanitized}`;
const varName = `migration${paddedIdx}Sql`;
const filePath = resolve(MIGRATIONS_DIR, `${tag}.ts`);

// 1. Create migration .ts file
const template = `/**
 * Migration ${paddedIdx} — ${sanitized.replace(/_/g, ' ')}.
 *
 * TODO: Describe what this migration does.
 */

export const ${varName} = \`
-- ${tag}
-- TODO: Write your SQL here.
-- Use \\\`--> statement-breakpoint\\\` between DDL statements.
\`.trim();
`;
writeFileSync(filePath, template, 'utf-8');
console.log(`📝 Created ${filePath}`);

// 2. Update journal
const newEntry: JournalEntry = {
  idx: nextIdx,
  version: '6',
  when: Date.now(),
  tag,
  breakpoints: true,
};
journal.entries.push(newEntry);
writeJournal(journal);
console.log(`📋 Added journal entry: ${tag} (idx ${nextIdx})`);

// 3. Increment SCHEMA_VERSION
const schemaVersionContent = readFileSync(SCHEMA_VERSION_PATH, 'utf-8');
const newVersion = nextIdx + 1;
const updatedContent = schemaVersionContent.replace(
  /export const SCHEMA_VERSION = \d+;/,
  `export const SCHEMA_VERSION = ${newVersion};`,
);
if (updatedContent === schemaVersionContent) {
  console.error('⚠️  Could not find SCHEMA_VERSION constant to update.');
} else {
  writeFileSync(SCHEMA_VERSION_PATH, updatedContent, 'utf-8');
  console.log(`🔢 SCHEMA_VERSION → ${newVersion}`);
}

// 4. Regenerate barrel
try {
  execSync(`npx tsx ${GEN_BARREL_SCRIPT}`, {
    cwd: resolve(__dirname, '..'),
    stdio: 'inherit',
  });
} catch {
  console.error('⚠️  Failed to regenerate barrel. Run `npx tsx scripts/gen-migration-barrel.ts` manually.');
}

console.log(`\n✅ Migration ${tag} scaffolded. Next steps:`);
console.log(`   1. Edit ${filePath}`);
console.log(`   2. Write your SQL`);
console.log(`   3. Run tests: pnpm test`);
