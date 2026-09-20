import { startMockServer } from './server.js';

const port = Number(process.env['PORT'] ?? 3000);
startMockServer(port).then(({ url }) => {
  console.log(
    `[mock:api] Xangarro mock API on ${url}  (X-Mock-Scenario: xangarro|xangarrito|grace|lapsed|revoked|flaky)`,
  );
  console.log(
    '[mock:api] codes: VALDK7M3 (valid) USEDK7M3 (used) EXPRK7M3 (expired) NSLTK7M3 (no slots) · POST /__mock/reset · POST /__mock/code · POST /__mock/forget|restore {table,id} · POST /__mock/scenario {scenario,recordsPerMonth?}',
  );
});
