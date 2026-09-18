import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { extractStrings } from './extract';
import { collectMobileSources, isMobileSource } from './files';
import { applyAllowlist, scanSource } from './scan';

const FILE = 'packages/ui/src/screens/Demo/demo.tsx';
const texts = (src: string): readonly string[] => extractStrings(FILE, src).map((s) => s.text);
const rules = (src: string): readonly string[] => scanSource(FILE, src).map((v) => v.rule);

describe('extraction', () => {
  it('reads JSX text, attribute copy and template literals', () => {
    const src = `
      const n = 3;
      export const A = () => (
        <Card title="Plan actual" testID="plan-card">
          Mejora tu plan
          <Text>{\`Te quedan \${n} registros\`}</Text>
        </Card>
      );`;
    assert.deepEqual(texts(src), ['Plan actual', 'Mejora tu plan', 'Te quedan {…} registros']);
  });

  it('skips i18n keys, imports, types, comments, logs and structural attributes', () => {
    const src = `
      import { Plan } from './plan';
      type Tier = 'Plan Pro';
      // Mejora tu plan en app.xangarro.mx
      export const A = (props: P) => {
        console.log('Upgrade flow');
        return <Banner icon="Activar" title={props.t('planLimit.title')} label={t('activate.submit')} />;
      };`;
    assert.deepEqual(texts(src), []);
  });

  it('records the i18n key path of catalog values', () => {
    const src = `export const esMX = { planLimit: { body: 'Tu plan Freelancer' } } as const;`;
    const [s] = extractStrings('packages/ui/src/i18n/locales/es-mx.ts', src);
    assert.equal(s?.key, 'planLimit.body');
    assert.equal(s?.line, 1);
  });

  it('reports every rule a string breaks', () => {
    const src = `const m = 'Tu negocio está en el plan Freelancer. Renueva en app.xangarro.mx.';`;
    assert.deepEqual(rules(src), ['store/plan-name', 'store/purchase-cta', 'store/web-link']);
  });

  it('passes a POS screen', () => {
    const src = `export const A = () => <Btn label="Cobrar">Precio de venta · Pagar con tarjeta</Btn>;`;
    assert.deepEqual(rules(src), []);
  });
});

describe('allowlist', () => {
  const found = scanSource(FILE, `const c = ['Suscripción', 'Activar'];`);

  it('suppresses an exact file + text match and counts it', () => {
    const res = applyAllowlist(found, [
      { file: FILE, text: 'Suscripción', reason: 'sale category' },
    ]);
    assert.deepEqual(
      res.violations.map((v) => v.text),
      ['Activar'],
    );
    assert.equal(res.suppressed, 1);
    assert.deepEqual(res.unused, []);
  });

  it('does not suppress the same text in another file', () => {
    const res = applyAllowlist(found, [{ file: 'other.tsx', text: 'Suscripción', reason: 'x' }]);
    assert.equal(res.violations.length, 2);
    assert.equal(res.unused.length, 1);
  });

  it('honours a rule-scoped entry only for that rule', () => {
    const entry = { file: FILE, text: 'Activar', reason: 'x', rule: 'store/plan-name' };
    const res = applyAllowlist(found, [entry]);
    assert.equal(res.violations.length, 2);
  });
});

describe('file selection', () => {
  it('keeps native sources and the i18n catalog', () => {
    assert.ok(isMobileSource('packages/ui/src/i18n/locales/es-mx.ts'));
    assert.ok(isMobileSource('packages/ui/src/share/share.native.ts'));
    assert.ok(isMobileSource('apps/mobile/src/app/(tabs)/ventas.tsx'));
  });

  it('skips web-only, test, story, declaration and archived files', () => {
    for (const p of [
      'packages/ui/src/share/share.web.ts',
      'packages/ui/src/components/TopBar/top-bar.web.tsx',
      'packages/ui/src/components/Btn/btn.test.tsx',
      'packages/ui/src/charts/Bar/bar.stories.tsx',
      'packages/ui/src/types.d.ts',
      'packages/ui/src/archive/director-home.tsx',
    ]) {
      assert.equal(isMobileSource(p), false, p);
    }
  });

  it('walks only the mobile roots of a checkout', () => {
    const root = mkdtempSync(join(tmpdir(), 'store-compliance-'));
    for (const rel of [
      'apps/mobile/src/app/index.tsx',
      'packages/ui/src/a.web.tsx',
      'packages/ui/src/b.ts',
      'apps/portal/src/pricing.tsx',
    ]) {
      mkdirSync(dirname(join(root, rel)), { recursive: true });
      writeFileSync(join(root, rel), '');
    }
    assert.deepEqual(collectMobileSources(root), [
      'apps/mobile/src/app/index.tsx',
      'packages/ui/src/b.ts',
    ]);
  });
});
