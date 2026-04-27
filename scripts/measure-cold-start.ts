/**
 * measure-cold-start.ts — record cold-start timings for both Cachink
 * apps (P1C-M12-T05, S4-C20).
 *
 * Baseline artefact for performance tracking: mid-range Android tablet
 * target is < 2 s to first paint per CLAUDE.md §1. This script is a
 * smoke harness — it doesn't actually boot the apps (that requires a
 * simulator); it writes a JSON record with the timestamp + environment
 * so the next slice can compare against a real measurement.
 *
 * Usage: `pnpm tsx scripts/measure-cold-start.ts [out-dir]`.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

interface ColdStartArtefact {
  readonly recordedAt: string;
  readonly mobile: { readonly targetMs: number; readonly measuredMs: number | null };
  readonly desktop: { readonly targetMs: number; readonly measuredMs: number | null };
  readonly notes: string;
}

function main(): void {
  const [, , outDir = 'perf-artifacts'] = process.argv;
  mkdirSync(outDir, { recursive: true });

  const artefact: ColdStartArtefact = {
    recordedAt: new Date().toISOString(),
    mobile: { targetMs: 2000, measuredMs: null },
    desktop: { targetMs: 3000, measuredMs: null },
    notes: 'Smoke run. Real measurements land in Phase 1F launch prep via EAS Build / Tauri CI.',
  };

  const file = join(outDir, `cold-start-${artefact.recordedAt}.json`);
  writeFileSync(file, JSON.stringify(artefact, null, 2) + '\n', 'utf8');
  console.log(`Cold-start artefact written to ${file}`);
}

main();
