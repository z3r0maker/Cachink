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

## `portal/` — the Director screens (added 2026-09-20, closes O-23)

Mirrored from the owner's export (`~/Downloads/XangarroDedign`, the
`design_handoff_xangarro_portal` set plus the root's Asesor/Avisos/Cortes).
Thirteen screens + the design-system pages + the runtime, same rules as
`operador/`: read-only, refreshed by re-exporting from the Claude Design
project (a `design:pull` script that automates this is still P-18's open
half). `comprobantes/` carries the four receipt-template designs N-20 waits
on. Every `.dc.html` and its `_ds/` runtime were verified serving 200 from a
plain static server after landing.
