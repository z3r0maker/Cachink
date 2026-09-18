# design-reference/ — read-only

A mirror of the Claude Design project `5dd266f3-42e7-403f-b941-95c8e6551dc6` (ADR-058). The
`.dc.html` files are the **specification**; code that disagrees with them is wrong.

- **Never hand-edit anything here.** A visual change lands in the design project first, then is
  pulled.
- `operador/` holds the second handoff (`design_handoff_operador/`): thirteen operator screens, two
  owner screens, `Operador Estado` (shared states), the implementation plan, and the handoff README
  (`HANDOFF-README.md`). Track O, `docs/plan/10-operador.md`.
- `support.js`, `doc-page.js` and `_ds/` are the design tool's runtime, vendored so each file opens
  directly in a browser. Product code never imports them.
- Excluded from Prettier, ESLint and `design-lint`.

**Pulled:** 2026-09-17, through the Claude Design MCP (`get_file`, byte-for-byte). `pnpm design:pull`
(P-18) is not built yet: the design API needs the MCP's own authorization, which a repo script
does not have.

**Serving:** open over HTTP, not `file://`, so `dc-import` can fetch `Operador Estado`:

```bash
npx serve design-reference/operador -l 4300
```
