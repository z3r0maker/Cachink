# Track E — «Empresa»: MEXIA's command center for the founders

> **Origin:** the owner conversation of 2026-10-07/08. MEXIA, S.A.S. (RESICO persona moral, two
> founders at 50/50, a founders' agreement with a performance pool) will operate Xangarro, and the
> owner wants "a command center of the company, visible to the partners, to make decisions".
> **ADR-124** records the architecture. This file holds the scope, the definitions, the phases and
> the tasks **E-01 … E-44**. The screens go to Claude Design through
> `21-command-center-design.md`.
>
> Read ADR-063 (the console), ADR-070 (CFDI for our own payments), ADR-124 and
> `17-consola-crecimiento.md` (N-63 MRR, N-70 decisions, N-72 cost per tenant) before a task here.

---

## 1. Owner decisions (2026-10-08)

1. **Founders only.** «Empresa» is a separate permission from staff (ADR-124 §1). Support hires
   never see it.
2. **Own tables, inside Xangarro for now.** It uses the `corp` schema, its own package
   (`@xangarro/data-corp`) and its own journal, so it can move to another system later (ADR-124 §2).
3. **Accounting-style, not the formal accounting.** It shows income, expenses (licences,
   marketing, infrastructure), taxes, IVA withholdings, issued and received invoices, capital
   contributions, and partner loans owed by the company. The contador keeps the legal books.
4. **Multi-project from day one,** with Xangarro as the only project (ADR-124 §3).
5. **LLM agents are welcome:** Claude Desktop through a local MCP server first, Microsoft Foundry
   later. Agents propose and founders approve (ADR-124 §6).
6. **Design goes to Claude Design** before code (ADR-117's rule: the canvas is the spec).

### Open owner decisions (answer before the task that needs it)

| #    | Decision                                         | Recommendation                                                                                             | Needed by |
| ---- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | --------- |
| OD-1 | Default basis of the P&L view                    | **Devengado** (invoiced in the month) with a «Flujo» toggle; taxes always use flujo (RESICO is cash basis) | E-12      |
| OD-2 | How shared costs split between projects          | By revenue share, with a manual override per cost. Irrelevant until project 2                              | E-41      |
| OD-3 | May MEXIA's financial data go to Claude/Foundry? | Yes for MEXIA's own books; **never** tenant PII. Revenue leaves only aggregated by project and period      | E-30      |
| OD-4 | Tablero wording the owner still finds ambiguous  | Settle the deliverable definition on the canvas (E-20's design) before coding it                           | E-20      |
| OD-5 | Which Claude Design project holds these screens  | A new **«Consola»** project (none exists; `design-reference/` holds portal, operador, comprobantes)        | E-01      |

## 2. Map of the area

`/empresa` routes in `apps/backoffice`, behind `requireFounder()`:

| Route                  | Screen               | The question it answers                                     | Phase |
| ---------------------- | -------------------- | ----------------------------------------------------------- | ----- |
| `/empresa`             | Resumen              | How is the company today, and what needs us?                | 1     |
| `/empresa/movimientos` | Movimientos          | What came in and went out, and why?                         | 0     |
| `/empresa/facturas`    | Facturas             | Which CFDIs did we issue and receive, and their state?      | 1     |
| `/empresa/resultados`  | Estado de resultados | Do we make money? Gross margin, EBITDA, net                 | 1     |
| `/empresa/balance`     | Balance y socios     | What do we own and owe, and what is each partner's account? | 1     |
| `/empresa/impuestos`   | Impuestos            | What ISR and IVA do we owe this month, and was it paid?     | 1     |
| `/empresa/caja`        | Caja                 | How much cash do we have, and how many months does it last? | 2     |
| `/empresa/presupuesto` | Presupuesto          | Are we within plan? Each partner's spending Límite          | 2     |
| `/empresa/tablero`     | Tablero              | What did each partner commit to and deliver this quarter?   | 2     |
| `/empresa/acciones`    | Acciones             | Who owns what, and how would the next pool cut fall?        | 2     |
| `/empresa/agenda`      | Agenda               | What is due, to SAT, SE and IMPI, and when?                 | 0     |
| `/empresa/expediente`  | Expediente           | Where is that document?                                     | 0     |
| `/empresa/cierre`      | Cierre del mes       | Is this month closed and reconciled?                        | 1     |
| `/empresa/corporativo` | Libro corporativo    | Partners, beneficial owners, actas, credentials, trademark  | 0     |
| `/empresa/propuestas`  | Propuestas           | What did the agents suggest that we must approve?           | 3     |

## 3. The ledger (ADR-124 §4)

**Capture is single-entry; storage is double-entry.** A founder records a _movement_, and a
domain function posts its balanced lines. Nobody types debits and credits.

| Movement                  | Posts (simplified)                                                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------------- |
| Cobro de suscripción      | Bank or «Stripe por depositar» ↑ · Ingresos (project) ↑ · IVA trasladado ↑                          |
| Payout de Stripe          | Bank ↑ · Stripe por depositar ↓ · Comisión de pasarela (costo del servicio) ↑                       |
| Gasto / factura recibida  | Expense account by category and project ↑ · IVA acreditable ↑ · Bank ↓ (or Proveedores ↑ if unpaid) |
| Gasto con retención       | as above, plus ISR/IVA retenidos por pagar ↑ (fees or rent paid to individuals)                     |
| Pago de impuestos         | ISR, IVA or retenciones por pagar ↓ · Bank ↓                                                        |
| Aportación de capital     | Bank ↑ · Capital social ↑                                                                           |
| Aportación adicional/AFAC | Bank ↑ · Aportaciones para futuros aumentos ↑ (also a pool credit, E-21)                            |
| Préstamo de socio         | Bank ↑ · Préstamos de socios (pasivo, by partner) ↑                                                 |
| Reembolso al socio        | Préstamos de socios ↓ · Bank ↓                                                                      |
| Transferencia             | Bank A ↓ · Bank B ↑                                                                                 |
| Comisión bancaria / FX    | Resultado financiero ↑ · Bank ↓                                                                     |
| Ajuste (founder-only)     | Free lines; must balance; needs a reason                                                            |

**Rules**

- **Immutable.** A wrong entry is reversed and recaptured. A month closed in E-14 is locked.
- **Chart of accounts.** About 40 accounts, each mapped to the SAT código agrupador (Anexo 24).
  The contador validates the mapping once (E-02), and E-43 exports by it.
- **Expense categories** drive the P&L lines:
  - **Costo del servicio:** infrastructure, payment gateway, CFDI stamping, transactional email,
    direct support.
  - **Ventas y marketing.**
  - **Desarrollo.**
  - **Administración:** contador, legal, government fees, internal tools.
  - **Depreciación y amortización.**
- **Each expense carries:** a project (or «compartido»), whether it is deductible, its IVA
  treatment (acreditable, not acreditable, exempt) and its currency.
- **USD.** Kept in USD plus the FX rate of the payment date (the DOF FIX rate; entered manually in
  v1, fetched from Banxico in E-42).
- **Sources:**
  - revenue imported from billing through `RevenueSource`;
  - CFDI XML upload for received invoices;
  - recurring templates for monthly services;
  - manual capture;
  - bank CSV (E-42).

## 4. Metric definitions (pure functions in `@xangarro/domain`, test-first)

```
Ingresos netos (sin IVA)
− Costo del servicio
= Utilidad bruta                → Margen bruto % = utilidad bruta ÷ ingresos netos
− Ventas y marketing − Desarrollo − Administración
= EBITDA                        → Margen EBITDA %
− Depreciación y amortización
= Utilidad de operación (EBIT)
± Resultado financiero (comisiones bancarias, diferencia cambiaria)
= Utilidad antes de impuestos
− ISR estimado (RESICO persona moral)
= Utilidad neta
Memo: costo de sudor = valor aceptado del Tablero no pagado → EBITDA económico = EBITDA − costo de sudor
```

| Metric                      | Definition                                                                                                                                                                                   |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ISR provisional (RESICO PM) | Year to date: (income actually collected − authorised deductions actually paid) × 30 %, minus provisional payments already made. Shared with the portal's estimate for persona-moral tenants |
| IVA del mes                 | IVA trasladado collected − IVA acreditable paid − IVA retenido (when applicable); cash basis                                                                                                 |
| Burn                        | Net cash out per month, as the average of the last 3 months                                                                                                                                  |
| Meses de caja (runway)      | Cash ÷ burn. «Sin consumo» when burn ≤ 0                                                                                                                                                     |
| CAC                         | Ventas y marketing spend ÷ new paying customers, per period and project                                                                                                                      |
| LTV                         | ARPA × gross margin % ÷ monthly churn (from N-63)                                                                                                                                            |
| Payback                     | CAC ÷ (ARPA × gross margin %), in months                                                                                                                                                     |
| Infra ÷ MRR                 | Costo del servicio, infrastructure line ÷ MRR (N-70's trigger, formerly N-72)                                                                                                                |
| Avance a tope SAS           | Company income year to date ÷ the year's SAS cap ($7,678,849.94 for 2026; published in the DOF each December)                                                                                |

**Every metric renders «sin datos» when an input is missing, never a misleading 0.**

## 5. The founders' agreement in the console

The signed agreement is in the Expediente. The console implements its mechanics, and the
**agreement wins** where they differ. All of its rules live in one pure module, test-first,
with property tests:

- **Vesting:** the base shares, the cliff and monthly consolidation.
- **Forfeits:** shares lost through incumplimiento.
- **Pool:** the cuts and their rounding.
- **Money cap:** a quarter's money counts at most as much as that quarter's deliverables.

- **Tablero (E-20).** Per quarter and per partner, each deliverable has:
  - a responsible partner;
  - a verifiable «criterio de terminado»;
  - two proposed values (the average is used automatically; a gap over 2× is flagged
    «requiere cotización»);
  - a state: comprometido → terminado → (objetado) → aceptado;
  - a 10-day objection clock.

  The board also checks each partner's minimum commitment and flags incumplimiento (under 50 %
  of the committed value) with the notice it requires.

- **Acciones (E-21).** For each partner it shows:
  - base shares consolidated and pending, by the schedule;
  - pool shares assigned;
  - forfeited shares;
  - **a live simulator of the next cut** with the quarter-to-date values;
  - the history of cuts and transfers, with their SE registration and beneficial-owner update
    status.
- **Aportaciones (E-03).** A per-partner ledger of capital, equal funding calls, additional money
  (counted 1:1 up to the cap, with the excess becoming a loan) and repayments.

## 6. Agents (ADR-124 §6)

**One tool layer, two runtimes.**

- **`@xangarro/corp-tools`** holds typed read tools and _propose_ tools. Its role is
  `xangarro_corp_agent`.
- **Runtime 1 (E-30):** a local stdio MCP server for Claude Desktop.
- **Runtime 2 (E-33):** console-side jobs through the Anthropic TypeScript SDK Tool Runner on the
  Foundry client.
- **Model:** `claude-opus-5-5`.
- **Every write is a row in `corp.agent_proposals`** that a founder approves in `/empresa/propuestas`.

| Agent                  | Trigger                         | Does                                                                                                                                          | Writes   |
| ---------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Clasificador de gastos | XML or receipt uploaded         | Proposes the category, project, deductibility, IVA treatment and recurring template                                                           | Proposal |
| Conciliador            | Bank CSV uploaded (E-42)        | Matches statement lines to movements, and proposes the missing ones                                                                           | Proposal |
| Analista de cierre     | Month end                       | Writes the month's narrative: variances, anomalies, runway change, triggers crossed                                                           | Report   |
| Asistente fiscal       | Agenda item within 7 days       | Explains the ISR and IVA estimate line by line, and lists the documents the contador needs                                                    | Report   |
| Secretario del Tablero | Deliverable drafted             | Rewrites the «criterio de terminado» to be verifiable and suggests a market value with sources. Neutral: both partners see the same rationale | Proposal |
| Pregúntale a MEXIA     | Founder question (Desktop chat) | Answers from the tools only, citing the screens and periods it used                                                                           | None     |

**Never by an agent:** post an entry, file with SAT, SE or IMPI, move money, or touch shares.

**Platform notes (checked 2026-10-08):**

- **Foundry** serves Claude through the same Messages API, with the dedicated `AnthropicFoundry`
  client.
- **Structured outputs and strict tools** work on Foundry.
- **The MCP connector** is in beta on Foundry.
- **Managed Agents is not on Foundry,** so we host the loop.

## 7. Constraints for every task

- **The usual rules (CLAUDE.md):**
  - integer centavos (`bigint`), parsed and never asserted (§2.8);
  - TDD in domain and application, with 1 happy path and 3 unhappy paths;
  - files ≤ 200 lines;
  - design tokens only, El Mostrador (ADR-117), es-MX copy, ≤ 5 options as cards;
  - every list implements loading, empty, error and with-data.
- **Founder gate on the server** for every `/empresa` page and action (`requireFounder()`),
  re-checked in each server action. Every write goes to `staff_audit_log` with `area = 'empresa'`.
- **Tenant data, minimal.** The founders see each paying business's name, plan and payment type in
  Movimientos › Ingresos (owner decision, 2026-10-08). RFC, members and usage stay in «Plataforma».
  Agent tools (`corp-tools`) still receive revenue aggregated by project and period only.
- **Playwright spec per screen** asserting real data reached it (a seeded `corp` fixture with a
  known P&L), in the backoffice e2e suite.
- **«Sin datos», never 0,** for a missing input. **No «Pronto» labels:** an unbuilt screen is
  omitted from the nav.

## 8. Tasks

**Phase 0 — at incorporation**

### E-01 Foundation: ADR-124, `data-corp`, founder gate, Claude Design project

- [ ] Status · **Blocked by:** OD-5
- **What:**
  - accept ADR-124;
  - create `@xangarro/data-corp` (Drizzle `schemaFilter: ['corp']`, its own journal), the
    `xangarro_corp` and `xangarro_corp_agent` roles, and `db-local.sh` / CI applying it;
  - `corp.projects` (seed Xangarro) and `corp.founders` (staff member id, founder number, name,
    RFC);
  - `requireFounder()` and the «Empresa» nav section, hidden for non-founders;
  - the «Consola» Claude Design project with the shell from `21-command-center-design.md` §1.
- **Acceptance:**
  - a staff member who is not a founder gets 404 on `/empresa` and sees no nav entry;
  - a migration test creates the schema from zero;
  - `pg_dump -n corp` restores into an empty database (the lift-out drill).

### E-02 Ledger core and Movimientos

- [ ] Status · **Blocked by:** E-01
- **What:**
  - domain: accounts, the movement → lines posting rules of §3, the balance check, reversal and
    the period lock;
  - `corp.accounts`, `corp.entries`, `corp.entry_lines` and `corp.recurring_templates`;
  - the `/empresa/movimientos` list (filters: period, project, type, category) with a capture
    drawer per movement type and recurring templates (Vercel, Supabase, Resend, Facturapi, the
    stores, domains, the contador);
  - the contador validates the código agrupador mapping.
- **Acceptance:**
  - every movement type posts balanced lines (property test);
  - a reversal nets to zero;
  - a locked month rejects new entries with a typed error;
  - a USD expense keeps both amounts and the rate.
- **Folds in N-72:** the vendor-invoice entry becomes recurring templates, and cost per tenant
  becomes a view (E-40).

### E-03 Aportaciones y préstamos de socios

- [ ] Status · **Blocked by:** E-02
- **What:**
  - the capital, equal funding call, additional contribution (AFAC), partner loan and repayment
    movements;
  - a per-partner account view (capital, AFAC, loan balance);
  - the 1:1 money cap and the excess-to-loan rule as domain functions.
- **Acceptance:**
  - a contribution over the quarter's cap splits into a pool credit and a loan;
  - repayments never exceed the loan balance;
  - loans carry no interest (agreement).

### E-04 Agenda fiscal y corporativa

- [ ] Status · **Blocked by:** E-01
- **What:**
  - obligation templates (authority, legal basis, recurrence, due rule «17 o siguiente día hábil»
    with a Mexican holiday table, applies or exempt with a reason);
  - instances moving pendiente → preparada → presentada → pagada;
  - reminders at 7, 3 and 1 days through the existing email and digest.
- **Seed with:**
  - ISR and IVA mensual;
  - declaración anual (31 mar);
  - informe anual SAS ante SE (marzo);
  - beneficiario controlador (15 días hábiles after a share event);
  - e.firma and CSD expiry;
  - opinión 32-D and buzón tributario (monthly);
  - DIOT and contabilidad electrónica as «exento, revisar RMF anual».
- **Acceptance:** a 17th that falls on a weekend or holiday moves to the next business day; an
  exempt template shows its reason and creates no instances.

### E-05 Expediente

- [ ] Status · **Blocked by:** E-01
- **What:**
  - a private `corp-docs` bucket;
  - documents carry a kind, period, obligation or entry link, sha256 and `retain_until`
    (≥ 5 years, CFF 30);
  - nothing is deleted: a new version supersedes the old one.
- **Acceptance:** a delete attempt is impossible through the role; supersede keeps both versions,
  and the history shows them.

### E-06 Libro corporativo

- [ ] Status · **Blocked by:** E-01, E-05
- **What:**
  - partners and the beneficial-owner file;
  - share events (they come from E-21; manual before then);
  - actas, and the IMPI trademark application (expediente, status, assignment to MEXIA);
  - e.firma and CSD serial numbers and expiry dates, metadata only, never key material.
- **Acceptance:** a share event creates its 15-business-day beneficial-owner obligation in E-04;
  a CSD expiring in 60 days raises a Resumen signal.

**Phase 1 — first month with revenue**

### E-10 Ingresos y facturas emitidas

- [ ] Status · **Blocked by:** E-02, B-10
- **What:**
  - the `RevenueSource` port over `billing.cfdi_payments` (and N-63's `billing_events` once they
    exist);
  - a daily import posting the «cobro» and «payout» movements per project;
  - `/empresa/facturas`, «Emitidas» tab: CFDI status, global CFDI, credit notes (read from ADR-070
    tables, never Stripe live).
- **Acceptance:** a month's imported income equals the month's `cfdi_payments` total without IVA;
  re-running the import posts nothing new (idempotent per payment id).

### E-11 Facturas recibidas

- [ ] Status · **Blocked by:** E-02, E-05
- **What:**
  - XML upload (drag and drop, several at once), parsed into the expense movement (emisor,
    subtotal, IVA, retenciones, uso, método de pago);
  - the SAT status check;
  - foreign providers without a CFDI: PDF plus manual capture;
  - the «Recibidas» tab.
- **Acceptance:** a duplicate UUID is rejected; a cancelled CFDI is flagged and posts nothing; a
  retención appears as a liability.

### E-12 Estado de resultados y Balance

- [ ] Status · **Blocked by:** E-02, OD-1
- **What:**
  - §4's cascade as domain functions shared with the portal;
  - `/empresa/resultados`: month, quarter and year; project or company; devengado or flujo; the
    sweat-cost memo line;
  - `/empresa/balance`: assets, liabilities and equity, plus the partner accounts.
- **Acceptance:** the balance sheet balances; gross margin and EBITDA match a fixture computed by
  hand; a period without costs captured shows «sin datos» for margin, not 100 %.

### E-13 Impuestos

- [ ] Status · **Blocked by:** E-12, the portal's RESICO persona moral fix (session task 2026-10-08)
- **What:**
  - the ISR provisional (RESICO PM, cumulative cash basis) and IVA del mes from the ledger;
  - estimate vs the contador's figure (a difference over $1 is flagged);
  - the acuse, línea de captura and proof of payment attached (E-05);
  - linked to its E-04 obligation.
- **Acceptance:** the estimate uses the same domain function as the portal; marking «pagado»
  without proof is blocked.

### E-14 Cierre del mes

- [ ] Status · **Blocked by:** E-10, E-11, E-13
- **What:** the checklist:
  1. global CFDI stamped;
  2. income imported;
  3. received invoices captured;
  4. bank balance confirmed;
  5. taxes estimated and declared;
  6. acuses attached;
  7. the contador's statements uploaded;
  8. lock.

  Unlocking needs both founders.

- **Acceptance:** a locked month refuses entries; unlock is audited with both approvals.

### E-15 Límites

- [ ] Status · **Blocked by:** E-10
- **What:** company-wide income year to date against the SAS cap and the RESICO PM cap, projected
  to year end from MRR, with signals at 60/80/95 %. Cap values are kept per year (the DOF update
  each December).
- **Acceptance:** two projects sum into one gauge; a year without the new cap captured warns
  instead of using last year's silently.

### E-16 Resumen

- [ ] Status · **Blocked by:** E-12, E-04
- **What:** `/empresa` home with:
  - the KPI strip: caja, meses de caja, MRR, margen bruto, EBITDA, impuestos del mes, avance al
    tope SAS;
  - the next 3 due items;
  - «Pendientes de socios» (objections, proposals, notices);
  - signals (runway < 6 months, gross margin < 70 %, infra ÷ MRR > 30 % for 2 months, tope
    60/80/95 %, an expiring CSD);
  - a pool summary.
- **Acceptance:** every tile has its 4 states; a signal links to the screen that explains it.

**Phase 2 — before the first pool cut (month 6)**

### E-20 Tablero

- [ ] Status · **Blocked by:** E-01, OD-4
- **What:** §5's Tablero, quarter by quarter: both partners' value proposals, average and 2×
  flag, verifiable criterion, the 10-day objection clock, minimum-commitment check, incumplimiento
  detection with the notice to send, the «terminado» evidence attached (E-05), and the fast
  dispute path (mediator) recorded.
- **Acceptance:** a value is frozen once work starts; when both partners fall short in the same
  quarter, no consequence is raised; a quarter with no agreed board copies the previous quarter's
  total commitment.

### E-21 Acciones y cortes

- [ ] Status · **Blocked by:** E-20, E-03, E-06
- **What:** the agreement module (vesting, forfeits, pool cuts with rounding and the zero-value
  rule, early freeze); `/empresa/acciones` with the live next-cut simulator; cut execution that
  creates the share transfer, its SE registration task and the beneficial-owner obligation.
- **Acceptance:** property tests keep each partner within 40–60 % outside forfeits and exits; the
  simulator matches the executed cut; a forfeited share never re-vests on a sale.

### E-22 Presupuesto

- [ ] Status · **Blocked by:** E-12
- **What:** a quarterly budget by category and project; actual vs budget; each partner's Límite
  (the larger of the fixed amount and a % of the 3-month average income), computed live; spending
  over the Límite outside the budget flagged for both partners' approval.
- **Acceptance:** with no income the fixed Límite applies; with income it scales.

### E-23 Caja

- [ ] Status · **Blocked by:** E-12
- **What:** bank balances (manual in v1), 3-month burn, runway, equal funding calls (amount, due
  date, each partner's transfer) and partner loans outstanding.
- **Acceptance:** runway shows «sin consumo» with non-positive burn; a funding call shows who has
  and has not paid.

**Phase 3 — agents**

### E-30 `corp-tools` and the Claude Desktop MCP server

- [ ] Status · **Blocked by:** E-12, OD-3
- **What:** typed read tools (P&L by period and project, movements search, agenda, Tablero,
  partner accounts, limits) and a local stdio MCP server with the `xangarro_corp_agent` role.
  Read-only.
- **Acceptance:** no tool accepts SQL; no tool returns tenant identifiers; the role cannot write
  outside `agent_proposals` (an integration test proves it).

### E-31 Propuestas

- [ ] Status · **Blocked by:** E-30
- **What:** `corp.agent_proposals` (kind, payload, rationale, sources, status, decided_by);
  propose tools; `/empresa/propuestas` with approve or reject. Approval runs the same use case as
  a manual capture.
- **Acceptance:** an approved proposal and a manual capture of the same movement produce identical
  entries; a rejected one leaves no trace in the ledger.

### E-32 The agents of §6

- [ ] Status · **Blocked by:** E-31
- **What:** prompts and tool sets for the clasificador, analista de cierre, asistente fiscal,
  secretario del Tablero and «Pregúntale a MEXIA», as Claude Desktop project instructions first,
  with a small eval set per agent built from real months.
- **Acceptance:** each agent's eval passes its rubric; every agent answer cites the period and the
  screen it used.

### E-33 Foundry runtime

- [ ] Status · **Blocked by:** E-32
- **What:** console-side jobs (month-end narrative, deadline briefings) on the Anthropic
  TypeScript SDK Tool Runner with the Foundry client, `claude-opus-5-5`, results delivered as
  proposals or reports.
- **Acceptance:** a job's tool calls are audited; a Foundry outage leaves the console fully usable
  without agents.

**Phase 4 — with volume or a second project**

### E-40 KPIs SaaS

- [ ] Status · **Blocked by:** N-63, E-12
- **What:** MRR, ARR, churn, ARPA, CAC, LTV, LTV ÷ CAC, payback and infra ÷ MRR per project, on
  Resumen and as N-70 trigger rows.

### E-41 Second project and shared-cost allocation

- [ ] Status · **Blocked by:** OD-2, a second project
- **What:** project creation, the allocation rule for «compartido» costs, and the per-project and
  consolidated toggles everywhere.

### E-42 Banco y tipo de cambio

- [ ] Status · **Blocked by:** E-23
- **What:** bank CSV import with matching (the conciliador agent proposes), and the Banxico FIX
  rate fetched daily.

### E-43 Exportación al contador

- [ ] Status · **Blocked by:** E-14
- **What:** a monthly export by código agrupador (balanza-style CSV), plus the month's XML and
  acuses in one archive.

### E-44 Salida a otro sistema

- [ ] Status · **Blocked by:** E-01
- **What:** a written and rehearsed runbook: dump `corp`, restore, swap the two ports, cut the
  console routes over.

## 9. Canvas round 2 (owner review, 2026-10-08)

The owner's review of round 1 changed these tasks. The canvas boards are the spec; this list says
what moved.

- **E-16 Resumen.** The page opens with **Autonomía sin nuevo capital** (one hero), which answers
  "can the operation continue without new capital?":
  - self-sufficient or not;
  - the cash in 12 months if income holds;
  - how far income can fall before the partners must fund (the break-even point);
  - months of cash if income stopped today.

  KPI tiles name their comparison and target and link to their screen. «De dónde sale la
  utilidad» shows the month's bridge from income to net profit.

- **E-12 Resultados.** The high-to-detail path:
  1. a waterfall from income to net profit;
  2. «¿Por qué cambió el EBITDA?», a variance bridge against the previous period with its drivers;
  3. income against costs by category over 6 months, with EBITDA margin;
  4. the statement, which expands category → account → movements.

  The sweat-cost memo stays.

- **E-10 Ingresos.** Movimientos gets type tabs (Todos, Ingresos, Gastos, Socios, Impuestos,
  Recurrentes). The «Ingresos» tab:
  - shows Xangarro's payments arriving automatically from Stripe, with no capture;
  - splits them into nuevos, renovaciones, cambios de plan and reembolsos, each with its CFDI;
  - adds the MRR movement chart and the month's mix.
- **E-20 Tablero.** A kanban for the quarter: Por hacer, En curso, En revisión (the 10-day
  objection window) and Terminado. The quarter's objectives sit on top, and each partner's
  committed vs delivered bar shows the 50 % line. Cards are of three kinds:
  - **Entregable con valor:** counts for the pool.
  - **Tarea:** operational work.
  - **Obligación:** mirrored from the Agenda.

  Every card has an owner, a due date and its done or accepted date.

- **E-04 Agenda › Evidencias.** A matrix of obligations by month showing acuse, payment, the
  positive opinión de cumplimiento and the buzón review. Nothing is marked presentada without its
  acuse or pagada without its proof. The monthly 32-D opinion is the external proof that
  everything is filed and paid.
- **E-06 Corporativo.** Partners and shares become the hero. The trademark is one row of
  **Registros y trámites** (RFC, SAS, marca, cuenta bancaria, dominios), each with a status, a next
  step and an action. «Actas y documentos» gets «Subir documento», and each document has «Ver».

## 10. Canvas round 3 (owner review, 2026-10-08)

New owner decisions:

- **Chart colors (OD-6, approved 2026-10-08).** Yellow and black stay brand and action colors,
  and never encode data. The «Paleta de datos» board defines a separate `dataviz` token group.
  The owner swapped income from green to aqua, so Desarrollo took the green and Costo del servicio
  and Administración traded colors to keep green away from orange, which protan vision cannot
  tell apart.

  | Role                           | Color             |
  | ------------------------------ | ----------------- |
  | Money in                       | aqua `#1BAF7A`    |
  | What remains                   | blue `#2A78D6`    |
  | Losses, cancellations, refunds | red `#E34948`     |
  | Taxes and financial            | gray `#8A8984`    |
  | Costo del servicio             | orange `#EB6834`  |
  | Ventas y marketing             | violet `#4A3AA7`  |
  | Desarrollo                     | green `#008300`   |
  | Administración                 | magenta `#E87BA4` |

  **Validation.** Every adjacent pair passes the dataviz validator (worst CVD ΔE 9.2, worst
  normal-vision ΔE 16.3). Aqua and magenta sit below 3:1 contrast, so they always carry labels.
  Aqua next to red (up/down) always carries a + or − sign.

  **Next step:** a design-system change adds the group to `@xangarro/tokens`, recorded with an
  ADR.

- **Unfinished work rolls over.** At quarter close, unfinished cards move to the next quarter and
  are recorded as «no cumplido» in the quarter they missed. Unaccepted value never counts for that
  quarter's pool cut.

Changes to existing tasks:

- **E-20 Tablero:** a year and quarter filter; the rollover above, with a «Del 3T: N tarjetas no
  se terminaron» panel; each partner's compliance % for the closed quarter.
- **E-42:** the bank-CSV half stays; the card-statement half moves to E-25.

### E-17 Resumen del trimestre

- [ ] Status · **Blocked by:** E-12, E-20, E-04
- **What:** `/empresa/trimestre`, by year and quarter.
  - **Headline:** a one-line headline written by the analista de cierre and approved by both
    founders, with income, EBITDA and margin, paying businesses and closing cash against the
    previous quarter.
  - **Growth:** QoQ income and EBITDA (a loss drawn below the axis), plus year-to-date and lifetime
    totals.
  - **Quarter review:** objectives met or missed, each partner's Tablero compliance, compliance
    with evidence, what went well and what to fix, and decisions taken.
  - **Exportar PDF.**
- **Acceptance:** a quarter that is not closed shows «en curso» and no headline; QoQ growth with a
  zero base shows «sin base», not ∞.

### E-24 Servicios

- [ ] Status · **Blocked by:** E-02
- **What:** `/empresa/servicios`, a catalogue of third-party services. Each service records:
  - name and purpose, and an expense category;
  - billing model: fixed (with currency), usage-based, commission, free or annual;
  - the card or account it is paid with;
  - its next charge, and its status: active, near its free limit, to contract, or new.
  - its 3-month average cost.

  Each service owns its recurring template in E-02. Usage-based services (Azure AI Foundry,
  Azure, Stripe commissions) get a 6-month chart and a current-month projection, with an alert
  threshold per service. A free tier gets its usage % against the plan's limit.

- **Acceptance:** a service's average equals the mean of its last 3 months of posted expenses; a
  usage projection never shows for a month with fewer than 3 days of data.

### E-25 Lectura de estados de cuenta con IA

- [ ] Status · **Blocked by:** E-24, E-31, OD-3
- **What:** upload a card or bank statement (PDF or image). `claude-opus-5-5` reads it through
  `corp-tools` (vision) into lines: date, raw description, amount. The flow then:
  1. checks that the lines add up to the statement's total;
  2. matches each line to a service or an already-posted movement;
  3. proposes the rest as movements, so only a founder's approval posts them (E-31);
  4. asks about lines with no match: a new service, a one-off expense, or «no es de MEXIA».

  The file goes to the Expediente; only the last 4 digits of the card are kept.

- **Acceptance:**
  - a statement whose lines do not add up to its total cannot be approved;
  - a line already posted is never proposed twice (matched by date, amount and service);
  - an eval set of real statements scores its extraction before rollout.

**E-21 Acciones (canvas, 2026-10-08).** The board «CD-14 Acciones y simulador del corte»:

- **The 12,000 shares** as one bar, in five parts: each partner's earned base, base still to earn,
  and the unassigned pool.
- **Per-partner cards:** vesting start date, base shares earned, pool shares assigned, forfeited
  shares, and the next vesting date.
- **An interactive simulator for the next cut,** with three scenarios: accepted only, + en
  revisión, + en curso. A slider adds value for Fundador 2. It shows:
  - the value table (Anexo A, accepted deliverables, money within the cap);
  - how the 600 shares split;
  - the transfer at nominal value;
  - each partner's resulting % and the 40–60 % range check.
- **The cut calendar.** Cuts fall 6, 12, 18 and 24 months after the signing date (28 Aug 2026):
  28 Feb 2027, 28 Aug 2027, 28 Feb 2028 and 28 Aug 2028.
- **Share history,** with what each cut creates: the transfer, its SE registration and the
  beneficial-owner update.

On this screen, partners are told apart by a colorblind-safe pair: blue `#2A78D6` and orange
`#EB6834`, with light tints for shares still to earn. These are identity colors scoped to this
screen, not the P&L roles.

## 11. Canvas round 4 (2026-10-08): Presupuesto, Caja, Propuestas

- **E-22 Presupuesto (CD-15).** A month or quarter view of the approved budget.
  - **Bars by category.** Each category shows spending in its category color, the month's
    projection (spent so far plus the recurring charges still to come) and a budget marker. The
    note says by how much a category would go over.
  - **Each partner's Límite.** The larger of $1,000 and 10 % of the 3-month average income,
    shown with how much each partner has used this month.
  - **«Fuera del presupuesto».** Requests above a partner's Límite wait for the other partner's
    approve, approve-another-amount or reject, with their effect on the month. Spending within the
    Límite is listed but needs no approval.
- **E-23 Caja (CD-15b, interactive).**
  - **Balances.** Total cash, the bank balance with «Confirmar saldo», and Stripe pending
    (automatic).
  - **Cash projection.** 6 months of actual month-end cash plus 6 months projected under three
    scenarios: income holds, income falls 34 % (break-even), income stops. A minimum-reserve line
    marks 3 months of spending.
  - **The month's cash in and out.**
  - **Partner money.** The equal funding call with who has paid, and partner loans. When cash
    allows, a «Proponer el reembolso» button appears; a payment to a partner needs both founders.
  - **Payments due in the next 30 days.**
- **E-31 Propuestas (CD-16).** Tabs: Por decidir, Para leer, Historial.
  - **Each proposal card** has the agent, when and why it was made, a «Por qué» with its sources,
    and approve, change-and-approve or reject. A statement-reading batch links to E-25's review
    screen.
  - **Reports** (the cierre narrative, the tax briefing) get «Marcar como leído».
  - **The agent roster** shows this month's activity and the «never do» list. The Foundry cost is
    shown in the header.
