#!/usr/bin/env node
/**
 * Release configuration gate (audit F-15d).
 *
 * Fails an EAS **production** build whose environment would ship an app that
 * cannot be trusted: no https API base, a public key that is not 64 hex
 * characters, or the published dev key. The rules are the tested ones in
 * `packages/ui/src/activation/release-config.ts`; this file only reads the
 * environment, runs them and reports.
 *
 * It runs as the `eas-build-post-install` npm hook (apps/mobile/package.json),
 * so on every EAS build, cloud or `--local`, before anything is compiled. EAS
 * sets `EAS_BUILD_PROFILE`; for any profile but `production`, and outside
 * EAS altogether (`expo start`, `expo run:*`), it exits 0 without a word.
 *
 * To check a configuration by hand:
 *   EAS_BUILD_PROFILE=production EXPO_PUBLIC_API_BASE=… \
 *     EXPO_PUBLIC_ENTITLEMENT_PUBKEY=… node scripts/check-release-config.mjs
 */

const GATED_PROFILE = 'production';

/** Where each rule's value comes from, for the report. */
const VARIABLE = {
  apiBase: 'EXPO_PUBLIC_API_BASE',
  entitlementPublicKeyHex: 'EXPO_PUBLIC_ENTITLEMENT_PUBKEY',
};

const RULES = new URL('../../../packages/ui/src/activation/release-config.ts', import.meta.url);

/**
 * The rules are TypeScript. Node reads it natively from 22.18; an older Node
 * goes through tsx, a devDependency of the repo that the install step
 * before this hook has put in place.
 */
async function loadRules() {
  if (process.features.typescript) return import(RULES.href);
  const { tsImport } = await import('tsx/esm/api');
  return tsImport(RULES.href, import.meta.url);
}

function report(profile, problems) {
  const lines = problems.map((p) => `  - ${VARIABLE[p.field]} [${p.code}]: ${p.message}`);
  console.error(
    [
      `✗ Release configuration: the "${profile}" build cannot ship as configured.`,
      ...lines,
      '  Set both as EAS environment variables for this environment, or as literal values',
      '  in eas.json "env". eas.json passes "env" values as written: "$NAME" is not expanded,',
      '  and it wins over an EAS variable of the same name.',
    ].join('\n'),
  );
}

async function main(env) {
  const profile = env.EAS_BUILD_PROFILE;
  if (profile !== GATED_PROFILE) return 0;
  const { releaseConfigProblems } = await loadRules();
  const problems = releaseConfigProblems({
    apiBase: env.EXPO_PUBLIC_API_BASE,
    entitlementPublicKeyHex: env.EXPO_PUBLIC_ENTITLEMENT_PUBKEY,
  });
  if (problems.length === 0) {
    console.log(`✓ Release configuration: ok for the "${profile}" build.`);
    return 0;
  }
  report(profile, problems);
  return 1;
}

main(process.env).then(
  (code) => {
    process.exitCode = code;
  },
  (error) => {
    // Closed, not open: a gate that cannot run its rules does not pass the build.
    console.error('✗ Release configuration: the check itself could not run.', error);
    process.exitCode = 1;
  },
);
