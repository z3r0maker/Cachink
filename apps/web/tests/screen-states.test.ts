import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The four data states, held in place (S-1, S-2).
 *
 * "Every portal screen implements all four." Four screens shipped an `empty`
 * prop they never reached — the copy was written, `isEmpty` was never passed,
 * and a period with no movements rendered a statement of zeros. Nothing caught
 * it because an unreachable state looks exactly like a working one.
 *
 * So this reads the screens rather than rendering them: `empty` copy and the
 * `isEmpty` that reaches it must travel together, in both directions. A screen
 * that cannot be empty says so by passing neither.
 */
const PORTAL = join(import.meta.dirname, '..', 'src', 'app', '(portal)');

function screens(): readonly { name: string; src: string }[] {
  return readdirSync(PORTAL, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => ({ name: e.name, file: join(PORTAL, e.name, 'screen.tsx') }))
    .filter((s) => existsSync(s.file))
    .map((s) => ({ name: s.name, src: readFileSync(s.file, 'utf8') }));
}

/**
 * The props of every `<ScreenBody …>` in a file — and only those. A table's own
 * `empty={<SinCortes/>}` is a different prop on a different component, so the
 * slice ends at the line that closes the opening tag (prettier puts the `>` on
 * its own line, and prettier is enforced).
 */
function screenBodyProps(src: string): readonly string[] {
  return src
    .split('<ScreenBody')
    .slice(1)
    .map((rest) => {
      const cierre = rest.search(/\n\s*>/);
      return cierre === -1 ? rest : rest.slice(0, cierre);
    });
}

describe('the four data states (S-1, S-2)', () => {
  it('finds the portal screens at all', () => {
    // A rename that empties this list would make every assertion below vacuous.
    assert.ok(screens().length >= 10, `only found ${screens().length} portal screens`);
  });

  for (const { name, src } of screens()) {
    it(`${name}: empty copy and isEmpty travel together`, () => {
      const copy = screenBodyProps(src).some((p) => p.includes('empty='));
      // File-wide: several screens resolve the state into a variable above the
      // JSX, so the call is not inside the tag. `isEmpty:` appears nowhere else.
      const reachable = src.includes('isEmpty:');
      assert.equal(
        copy,
        reachable,
        copy
          ? `${name} writes empty copy nothing can reach — pass isEmpty, or drop the prop`
          : `${name} passes isEmpty with no empty copy — the state would render blank`,
      );
    });
  }

  it('the portal has a loading boundary', () => {
    // Without it a navigation freezes on the outgoing screen: nothing to say
    // the click registered. ADR-107 replaced the static gray blocks with Don
    // Cuentas counting; the boundary must use that one component, not its own.
    const file = join(PORTAL, 'loading.tsx');
    assert.ok(existsSync(file), 'expected (portal)/loading.tsx');
    assert.ok(
      readFileSync(file, 'utf8').includes('DonCargando'),
      'the boundary must render the shared DonCargando loader',
    );
  });
});
