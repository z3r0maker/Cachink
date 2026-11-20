import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { describe, it } from 'vitest';
import { parse } from 'yaml';

import { flagLines } from '../src/isolation/record';
import { PHONE_TOOLS, WEB_TOOLS } from '../src/runner/tools';
import { ConfigSchema } from '../src/schemas/config';

/**
 * S-07's acceptance, held: the README shows the exact flags and allow-lists a
 * run starts the actor with, and cites the isolation record, whose last
 * verdicts are both «isolated». A flag changed in code without the README, or
 * a probe that failed, fails here.
 */
const SYNTH = resolve(import.meta.dirname, '../..');
const readme = readFileSync(join(SYNTH, 'README.md'), 'utf8');
const model = ConfigSchema.parse(parse(readFileSync(join(SYNTH, 'config.yaml'), 'utf8'))).models
  .actor;

describe('tools/synth/README.md', () => {
  it('shows the web actor’s flags exactly as actorArgs renders them', () => {
    assert.ok(
      readme.includes(flagLines(WEB_TOOLS, model)),
      'regenerate the web block from isolation.md',
    );
  });

  it('shows the phone actor’s flags exactly as actorArgs renders them', () => {
    assert.ok(
      readme.includes(flagLines(PHONE_TOOLS, model)),
      'regenerate the phone block from isolation.md',
    );
  });

  it('cites the isolation record, and that record shows both actors isolated', () => {
    assert.match(readme, /\[`isolation\.md`\]\(\.\/isolation\.md\)/);
    const record = join(SYNTH, 'isolation.md');
    assert.ok(existsSync(record), 'run `pnpm --filter @xangarro/synth-core isolation`');
    const text = readFileSync(record, 'utf8');
    assert.match(text, /^## Web: isolated$/m);
    assert.match(text, /^## Phone: isolated$/m);
    assert.doesNotMatch(text, /NOT isolated/);
  });
});
