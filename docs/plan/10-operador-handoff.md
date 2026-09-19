# Track O — handoff (operator register + owner close-out)

**Date:** 2026-09-18 · **Last Track O commits on `main`:** `32768f6f` (amended designs pulled and
followed), `aed5e184` (second-round decision). Read this with `CLAUDE.md`, `docs/plan/10-operador.md`
(the task list) and ADR-071 … ADR-077, ADR-083 and ADR-085 in `ARCHITECTURE.md`.

## 1. Where things stand

- **Every screen of the operator handoff is built on fixtures** except Acceso (O-12) and the lock
  (O-13): Inicio, Turno, Avisos, Caja, Ventas, Detalle de venta, Gastos, Inventario, Cobranza,
  Detalle de cliente, Registros por enviar and Cierre, under `/operador/*`; and the two owner
  screens, `/revision-caja` and `/cortes`.
- The 16 design files were re-pulled on 2026-09-18 after the owner applied every first-round
  amendment in Claude Design; the code follows them (ADR-085). Figures of the example day:
  $3,120.00 cobrado, $1,980.00 in cash, $550.00 cash abonos, $620.00 gastos, fondo $800.00,
  **$2,710.00 expected**.
- **Nothing reads or writes real data yet.** Every screen takes a fixture from
  `apps/web/src/operador/**/fixture.ts`, `operador/fixtures.ts` (`SHELL_FIXTURE`, `HOY =
'2026-05-14'`) or `app/(portal)/{cortes,revision-caja}/fixture.ts`. Cancelling a sale, abonos,
  gastos, mermas, the close and «Marcar como aclarado» are device-local state until O-06.
- Tests: `apps/web/tests/operador/*.test.ts` (53 unit tests), `apps/web/e2e/operador-*.spec.ts`
  (145 passing over the desktop/laptop/tablet projects), `e2e/dueno-cortes.spec.ts` and
  `e2e/dueno-revision-caja.spec.ts` (25 passing).

## 2. Pending work, in dependency order

Status and full steps live in `docs/plan/10-operador.md` (O-_) and `docs/plan/02-contracts.md`
(C-_). None of these has started.

| Task     | What                                                                                                      | Blocked by                                                                                                  | Unblocks                        |
| -------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------- |
| **C-16** | Browser devices (`plataforma = web`) and the 4-digit NIP (ADR-071, ADR-072)                               | —                                                                                                           | O-04, O-05                      |
| **C-17** | Ticket header entity; `sales` become lines (ADR-073)                                                      | —                                                                                                           | O-05, fase 11 real data         |
| **C-18** | Receivables, expected cash per turno, review status (ADR-074)                                             | —                                                                                                           | O-03, O-05                      |
| **C-19** | Operator messages and replies, `mensajes_operador` (ADR-075)                                              | —                                                                                                           | O-16 Avisos, «Pedir aclaración» |
| **O-02** | Restore `packages/sync/src`; SQLite-WASM on OPFS spike in Chromium + WebKit                               | `packages/sync/src` is **not on `main`** (only on branch `rename/xangarro-stored-ids`); wait for it to land | O-05, O-06                      |
| **O-03** | Scope `efectivoEsperado` by `cajaTurnoId`; `CerrarCajaUseCase` uses it                                    | C-18                                                                                                        | real Turno/Cierre figures       |
| **O-04** | «Nuevo operador» and «Reiniciar NIP» in `/equipo`; remove the phone's recovery/change-PIN flow            | C-16                                                                                                        | O-12                            |
| **O-05** | Real `/sync/push` and `/sync/pull` (B-08, B-09), serving web devices                                      | O-02, C-16 … C-19                                                                                           | O-06                            |
| **O-06** | Register runtime: device token auth, SQLite Worker, `storage.persist()`, outbox flusher, connection state | O-02, O-05                                                                                                  | O-12 … O-16 on live data        |
| **O-12** | Operador · Acceso: link (8-char code, text input) → NIP → fondo. **Design is ready** (amended file)       | O-04, O-06                                                                                                  | O-13, fase 10 gate              |
| **O-13** | Register lock and operator switch without losing the ticket                                               | O-12                                                                                                        | fase 10 gate                    |

**Hard stop from the plan:** in O-02, if the Drizzle driver does not run on WASM, stop and ask the
owner (ADR-071 §4).

What O-06 must replace when it lands (search for `O-06` in `apps/web/src`):

- `shell/cola.tsx` — the queue is a fixture that «sends» after 1.4 s; wire the outbox flusher.
- `ventas/cancelar.tsx`, `ventas/detalle/screen.tsx` — cancellation is local state.
- `cobranza/**` — abonos are local; accounts come from `cobranza/cuentas.ts`.
- `gastos/use-gastos.ts` — receipts: private Storage bucket
  `comprobantes/<business>/<turno>/<gasto>.jpg`, uploaded after the row syncs (ADR-083 D3).
- `cierre/use-cierre.ts` — the close; reasons map to `caja_turnos`' six via
  `operador/vocabulario.ts` (ADR-083 D6); expense categories via the same file (D4).
- `app/(portal)/cortes/use-cortes.ts` — «Marcar como aclarado» (C-18) and «Pedir aclaración»
  (C-19, lands in the operator's Avisos).
- `app/(portal)/revision-caja/*` — approve / merge / reject are local.

## 3. Findings not attended

1. **Second design round, deferred to a UX audit (owner, 2026-09-18).** The code keeps its
   version of each; the paste-ready requests are in `10-operador-design-changes.md`:
   - Inicio «dos canceladas…» / Turno «cuatro con comprobante» start lowercase in the files; code
     capitalises (`src/operador/ui/frases.ts`).
   - Cortes «×0» in gray-400 on gray-100 (2.4:1, under AA); code keeps gray-600.
   - Owner components vs the files: KPI figure 32 px vs 34, tab tracking 0.05em vs 0.04 and count
     weight 800 vs 700, «Exportar mes» 16 px radius / 4 px shadow vs 12 / 3.
2. **ADR-083 D1, D3, D4 and D6 are still provisional** (type floor 12 with the 11 px tag exception;
   receipt storage; expense category mapping; close-out reason mapping). The owner may reverse
   any; each item in ADR-083 says what changes.
3. **Dev-only forcing is not covered by E2E.** Query-string forcing (`?dataState=`, `?situacion=`,
   `?connection=sin-conexion`, `?ultimoCorte=faltante`, `?venta=`, `?estado=cancelada`,
   `?enCola=true`, `?startFilter=`) is ignored in production builds, which is what the E2E suite
   runs. Loading/empty/error states and the queued-sale state were checked with the harness
   (appendix) only.
4. **Detalle de venta** only has designed lines for V-0412 and V-0409; any other folio renders the
   empty state until real tickets exist.
5. **Cierre «Abrir otro turno»** goes to Inicio until Acceso (O-12) exists.
6. **No `pnpm design:pull` script.** The Claude Design project
   (`5dd266f3-42e7-403f-b941-95c8e6551dc6`) is read through an authorised tool call (DesignSync
   `get_file`), which a repo script cannot make. Refreshing `design-reference/operador/` is a manual
   pull; write the fetched content byte-for-byte, never by hand (ADR-058). DesignSync writes are
   only for design-system projects, never for this prototype project.
7. **Header sync pill vs queue.** Online, the shell says «Todo enviado» while the fixture queue
   still holds 3 records (Cierre shows its band). Both follow their files; real state arrives with
   O-06.
8. **Owner `KpiCard` comment says 34 px** but uses `fontSizes.xl5` (32). Part of item 1; fix
   whichever way the audit decides.

## 4. Working rules that bind this track

- The design files in `design-reference/` are the specification and are never edited by hand.
- One screen per task; reproduce every value from the file; compare your render with the design at
  the same width and fix differences before reporting. If a README rule clashes with existing code,
  stop and ask.
- CLAUDE.md: files ≤ 200 lines, functions ≤ 40 (ESLint enforces `max-lines-per-function`),
  components ≤ 150; money is bigint centavos (`123_45n`); no `any`, `@ts-ignore`,
  `eslint-disable`; TDD for domain/application with happy path + 3 unhappy paths.
- **Shared checkout:** several sessions work in `/Users/eduardo.torres/Downloads/Cachink` at once.
  Commit only your own paths (`git add --pathspec-from-file=<list>`), never `git add -A`; avoid
  `git mv`/`git rm` mid-work. Push from a clean worktree:
  `git worktree add --detach <tmp> origin/main`, cherry-pick, `pnpm install --frozen-lockfile
--prefer-offline`, `git push origin HEAD:main` (pre-push runs lint, typecheck and tests). Never
  force, never `--no-verify`. Uncommitted files you did not write (e.g. in `packages/domain`,
  `packages/data-pg`, `.zcode/`) belong to someone else.
- Commit messages end with a `Co-Authored-By:` line for the agent.

## 5. How to run things

The portal app is **`apps/web`** (package `@xangarro/web`; renamed from `apps/portal` by N-35 — an
untracked `apps/portal/` leftover may still sit on disk; ignore it).

- Dev server: `pnpm --filter @xangarro/web dev` on port 3100 with
  `DATABASE_URL=postgres://xangarro_app:xangarro_app@localhost:55432/xangarro`
  (`.claude/launch.json` entry «portal»). If pages 500 with «Can't resolve 'path'», delete
  `apps/web/.next/dev` and restart.
- Unit tests: `cd apps/web && npx vitest run tests/operador`. Vitest cannot import `.tsx`, so keep
  testable logic in `.ts` files; derive files use relative imports (no `@/`).
- Lint / types: `npx eslint src/operador src/app/operador "src/app/(portal)/cortes"` and
  `npx tsc --noEmit -p tsconfig.json` from `apps/web`.
- **Operator E2E** (production build per port in `.next-e2e/<port>`). The global setup checks the
  shared database seed and may fail on data other sessions changed; skip it with a temporary,
  uncommitted config `apps/web/playwright.op.tmp.config.ts`:

  ```ts
  import base from './playwright.config';
  export default { ...base, globalSetup: undefined };
  ```

  then
  `E2E_PORT=3217 DATABASE_URL=$(../../packages/data-pg/scripts/db-local.sh url) npx playwright test -c playwright.op.tmp.config.ts --no-deps --output <tmp>/pw-out e2e/operador-*.spec.ts`.
  Use your own `--output` directory and delete the temporary config afterwards.

- **Owner E2E** (needs the owner cookie): with the dev server up, run the same command with
  `E2E_PORT=3100` (reuses the dev server) and **without** `--no-deps`, so the `setup` project writes
  `apps/web/e2e/.auth/owner.json`. Never type the test credentials into a browser yourself.

## Appendix — the design comparison harness

It renders the design file and our page in two same-width iframes on the dev origin and lists
element-by-element differences (rect, font, box). Setup (both paths are gitignored in
`apps/web/.gitignore`):

```sh
mkdir -p apps/web/public
ln -sfn ../../../design-reference/operador apps/web/public/__design
cp <this appendix's script> apps/web/public/__cmp.txt
```

In a page on `http://localhost:3100` (Playwright with `storageState: apps/web/e2e/.auth/owner.json`
for owner routes), evaluate the script, then e.g.
`await __cmp({ design: 'Xangarro Portal - Operador Turno.dc.html', ours: '/operador/turno', width: 900 })`.
`props` sets the design's control panel (`{ cliente: 'mari' }`, `{ dataState: 'empty' }`);
`act(doc)` runs in both frames before measuring (open a modal); `rootD`/`rootM` pick the compared
subtree (`'[role=dialog]'`). Expected noise: MISSING/EXTRA pairs where the design runtime splits
one sentence into several text nodes. Remove the symlinks when done.

```js
// Design-vs-code comparison harness. Run in a tab on http://localhost:3100.
// window.__cmp({ design: 'Xangarro Portal - Operador Inicio.dc.html', ours: '/operador',
//                props: { situacion: 'vendiendo' }, width: 1440, height: 900, root: 'main' })
window.__cmp = async ({
  design,
  ours,
  props = {},
  width = 1440,
  height = 900,
  root = 'main',
  rootD,
  rootM,
  act,
}) => {
  const frame = (src) =>
    new Promise((res) => {
      const f = document.createElement('iframe');
      f.style.cssText = `position:fixed;left:-${width + 100}px;top:0;width:${width}px;height:${height}px;border:0`;
      f.onload = () => res(f);
      f.src = src;
      document.body.appendChild(f);
    });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const grab = (doc, sel) => {
    const main = doc.querySelector(sel);
    if (!main) return [];
    const o = main.getBoundingClientRect();
    const out = [];
    const seen = new Set();
    for (const e of main.querySelectorAll('*')) {
      if (['path', 'circle', 'rect', 'title', 'svg', 'line', 'polyline'].includes(e.tagName))
        continue;
      const cs = doc.defaultView.getComputedStyle(e);
      const own = [...e.childNodes]
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent.trim())
        .join(' ')
        .trim();
      const boxy = cs.borderTopWidth !== '0px' || cs.backgroundColor !== 'rgba(0, 0, 0, 0)';
      if (!own && !boxy) continue;
      let t = e;
      const p = e.parentElement;
      const pBoxy = (() => {
        const q = doc.defaultView.getComputedStyle(p);
        return q.borderTopWidth !== '0px' || q.backgroundColor !== 'rgba(0, 0, 0, 0)';
      })();
      if (
        own &&
        e.tagName === 'SPAN' &&
        p.childElementCount === 1 &&
        p.textContent.trim() === own &&
        !doc.defaultView.getComputedStyle(p).display.includes('flex') &&
        !pBoxy
      )
        t = p;
      if (seen.has(t)) {
        // A boxed badge already emitted: its text still counts, by font only.
        if (own)
          out.push({
            t: own.slice(0, 30),
            r: [0, 0, 0, 0],
            f: [cs.fontSize, cs.fontWeight, cs.letterSpacing, cs.color, cs.textTransform].join('/'),
            b: '',
            inBox: true,
          });
        continue;
      }
      seen.add(t);
      const r = t.getBoundingClientRect();
      if (r.width === 0) continue;
      const rect = [r.x - o.x, r.y - o.y, r.width, r.height].map(Math.round);
      const font = [cs.fontSize, cs.fontWeight, cs.letterSpacing, cs.color, cs.textTransform].join(
        '/',
      );
      const box = [
        cs.backgroundColor,
        cs.borderTopWidth,
        cs.borderRadius,
        cs.boxShadow.slice(0, 24),
      ].join(' ');
      // Text that is the only content of a bordered/filled box: the design wraps
      // it in a runtime span, the code does not. Emit the box, then the text,
      // and compare that text by font only.
      const pcs = p ? doc.defaultView.getComputedStyle(p) : null;
      const parentBoxy =
        pcs && (pcs.borderTopWidth !== '0px' || pcs.backgroundColor !== 'rgba(0, 0, 0, 0)');
      if (own && boxy) {
        out.push({ t: '', r: rect, f: '', b: box });
        out.push({ t: own.slice(0, 30), r: rect, f: font, b: '', inBox: true });
      } else {
        const inBox =
          !!own &&
          e.tagName === 'SPAN' &&
          p.childElementCount === 1 &&
          parentBoxy &&
          p.textContent.trim() === own;
        out.push({ t: own.slice(0, 30), r: rect, f: own ? font : '', b: boxy ? box : '', inBox });
      }
    }
    return out;
  };
  const [d, m] = await Promise.all([frame('/__design/' + encodeURI(design)), frame(ours)]);
  await wait(2500);
  if (Object.keys(props).length) {
    d.contentWindow.__dcSetProps(d.contentWindow.__dcRootName(), props);
    await wait(600);
  }
  if (act) {
    await act(d.contentDocument);
    await act(m.contentDocument);
    await wait(700);
  }
  const D = grab(d.contentDocument, rootD ?? root),
    M = grab(m.contentDocument, rootM ?? root);
  d.remove();
  m.remove();
  const key = (x) => x.t || 'box ' + x.b.split(' ').slice(0, 4).join('');
  const lines = [];
  let i = 0,
    j = 0;
  while (i < D.length || j < M.length) {
    const a = D[i],
      b = M[j];
    if (a && b && key(a) === key(b)) {
      const diffs = [];
      const rd = a.inBox || b.inBox ? [] : a.t ? [0, 1, 3] : [0, 1, 2, 3];
      if (rd.some((k) => Math.abs(a.r[k] - b.r[k]) > 1)) diffs.push('rect ' + a.r + ' vs ' + b.r);
      if (a.f !== b.f) diffs.push('font ' + a.f + ' vs ' + b.f);
      if (a.b !== b.b) diffs.push('box ' + a.b + ' vs ' + b.b);
      if (diffs.length)
        lines.push((a.t || '[box]') + ' @' + a.r.slice(0, 2) + ': ' + diffs.join(' ; '));
      i++;
      j++;
    } else if (a && !M.slice(j).some((x) => key(x) === key(a))) {
      lines.push('MISSING ' + (a.t || '[box ' + a.b + ']') + ' @' + a.r);
      i++;
    } else if (b && !D.slice(i).some((x) => key(x) === key(b))) {
      lines.push('EXTRA ' + (b.t || '[box ' + b.b + ']') + ' @' + b.r);
      j++;
    } else {
      lines.push(
        'ORDER ' +
          (a ? key(a) : '-') +
          ' | ' +
          (b ? key(b) : '-') +
          ' @' +
          (a ? a.r : '') +
          ' / ' +
          (b ? b.r : ''),
      );
      i++;
      j++;
    }
  }
  return (
    `design ${D.length} · ours ${M.length} · ${lines.length} diffs\n` +
    lines.slice(0, 70).join('\n')
  );
};
('harness ready');

// Click the first element whose own text is `text` (button, role=button or link).
window.__click = (doc, text) => {
  const el = [...doc.querySelectorAll('button,[role=button],a')].find(
    (x) => x.textContent.trim() === text,
  );
  if (!el) throw new Error('no element: ' + text);
  el.click();
};
```
