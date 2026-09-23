# Privacy audit: what Xangarro collects vs. what the aviso says (2026-09-22)

> **Date:** 2026-09-22 · **Scope:** the privacy program, not the code's security (that is
> `security-2026-09-17.md`). **Lens:** LFPDPPP (DOF 20-03-2025, última reforma 14-11-2025), the
> Reglamento de 2011 as supletorio, App Store / Play store declarations, and the AI-disclosure
> question the owner raised.
> **Code read:** `main` at `c0c90bfc` plus the uncommitted geo/attribution work in the tree.
> **Relationship to N-34:** `docs/legal/aviso/` already holds a strong draft set (2026-09-17). This
> is the **delta**: what the product started collecting after that draft was written, and the three
> disclosure topics the draft left as placeholders. Nothing here is legal advice; it is input for
> the abogado who still has to review N-34.

## Summary

| ID          | Sev      | Area                | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Evidence                                                                          |
| ----------- | -------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| PRIV-GEO-01 | **high** | Geolocation         | The aviso's §3 table has no geolocation row. Since N-55…N-61 the product derives a **Mexican state** from every portal access and every landing visit, and keeps 400 days.                                                                                                                                                                                                                                                                                       | `server/geo/*`, `drizzle/0033_geo_prune.sql`, `api/geo/pixel/route.ts`            |
| PRIV-GEO-02 | medium   | Landing beacon      | `xangarro.mx` fires a 1×1 GIF at the portal on every visit. The aviso covers the portal; the **landing page has no aviso surface at all**.                                                                                                                                                                                                                                                                                                                       | `api/geo/pixel/route.ts`, `server/geo/pixel.ts`                                   |
| PRIV-ATR-01 | medium   | Attribution         | `signup_attribution` stores source/medium/campaign **and region per business**, written at signup. Undisclosed, and no retention rule (geo has one, this does not).                                                                                                                                                                                                                                                                                              | `0016_admin_attribution_read.sql`, `server/attribution/*`                         |
| PRIV-IA-01  | **high** | Asesor / IA         | The model boundary now exists (`@anthropic-ai/sdk`, gateway-configurable). The aviso's §11 describes only deterministic arithmetic and predates it.                                                                                                                                                                                                                                                                                                              | `apps/web/src/server/asesor/model.ts`                                             |
| PRIV-IA-02  | **high** | Provider chain      | Decided 2026-09-22: **Azure AI Foundry**. Claude there is a _partner-sold_ Marketplace model, so §6.1 gains **two** rows (Microsoft + Anthropic), Azure OpenAI ZDR does **not** apply, and residency depends on a deploy-time hosting choice.                                                                                                                                                                                                                    | Microsoft Learn, Claude-models data-privacy (2026-06-23)                          |
| PRIV-IA-03  | medium   | Art. 26 II exposure | The Asesor analyses the titular's **"situación económica"** — the exact phrase art. 26 II uses. The opposition right must be real, not a sentence.                                                                                                                                                                                                                                                                                                               | `domain/src/asesor/insights.ts`; LFPDPPP art. 26 II                               |
| PRIV-3P-01  | low      | Analytics           | §10 still ships the placeholder `[xangarro.mx usa / no usa herramientas de analítica: DESCRIBIR o eliminar]`. The verified answer is **none** — worth saying out loud.                                                                                                                                                                                                                                                                                           | `docs/legal/aviso/aviso-integral.md:253`; no analytics dep anywhere               |
| PRIV-3P-02  | medium   | Provider table      | Owner decision 2026-09-22: public aviso lists processors **by category + country** (legally sufficient: art. 15 does not require naming encargados; Reg. art. 53); the named list goes to negocios in the Anexo and on request. Countries for error monitoring, mail and messaging still `[PAÍS]`.                                                                                                                                                               | `aviso-integral.md` §6.1                                                          |
| PRIV-ST-01  | medium   | Store declarations  | No Apple Privacy Nutrition Label / privacy manifest and no Play Data Safety form exists in the repo. Both are submission blockers and both must match the aviso.                                                                                                                                                                                                                                                                                                 | `docs/store/*`                                                                    |
| PRIV-REG-01 | **high** | Registration        | **Fixed 2026-09-22.** `/signup` collected name, business, email and password with no aviso, no affirmative act and no consent record. Now: simplified aviso above the button, one express checkbox + pre-ticked novedades, `CONSENT_REQUIRED` in the use case, and hash-chained `privacy_consents` rows written in the signup transaction (drizzle/0034). Migration apply, E2E run and the nightly seal are tracked in `docs/launch/production-readiness.md` §2. | `signup/consent.tsx`, `registrar-cuenta-use-case.ts`, `0034_privacy_consents.sql` |
| PRIV-OPS-01 | **high** | Operable rights     | ARCO intake, self-service account deletion, a retention calendar and a breach protocol are all still `[nuevo]` in the N-34 README. A policy that describes absent machinery is the expensive kind of wrong.                                                                                                                                                                                                                                                      | `docs/legal/aviso/README.md` §4                                                   |

## 1. What is actually collected (verified, not assumed)

The owner named "geolocation, movements, income". Read against the code, those are three very
different risk profiles, and the difference is the whole argument:

- **Movements and income** — ventas, egresos, inventario, cortes, saldos. Already in §3 as _Registros
  del negocio_, already flagged as patrimonial for a persona física. Correctly handled: art. 7
  párrafo quinto requires **consentimiento expreso** for datos financieros o patrimoniales, and the
  draft asks for a separate checkbox rather than leaning on the art. 9 IV exception. Keep that.
- **Geolocation — is not device location.** There is no `expo-location`, no GPS permission, no
  coordinates. What exists is Vercel's **edge-derived region** (a Mexican state code) counted into
  `xangarro.geo_counters`, and the IP touched only as a SHA-256 throttle key. `geo_prune` (0033)
  clamps retention at ≥90 days and defaults to 400. The landing beacon sets **no cookie, no ETag, no
  identifier** — by construction there is nothing to correlate across visits.
- **Attribution** — `signup_attribution` is the one row-level location in the system: one row per
  business carrying source/medium/campaign/region. The console can only read it **grouped**
  (`admin_attribution_rollup`), and `xangarro_admin` cannot execute the writer. Good design; it is
  still personal data about the dueño, and it is still undisclosed.

That asymmetry is the single most valuable thing to put in the aviso, because it is true and almost
nobody in this market can say it: **Xangarro infers a state from an IP; it never asks for your
location.** Say it plainly and the geolocation question stops being scary.

## 2. Privacy policy: the structure is already right

The three-layer shape in `docs/legal/aviso/` (integral + simplificado per surface + ARCO procedure)
is what art. 16 II requires and should not be redesigned. Art. 15 has six fracciones and the draft
covers all six. The work is not a rewrite — it is **filling placeholders and adding what shipped
since**. Specifically: a geolocation row in §3, an attribution row in §3, a real §10, real countries
in §6.1, and the IA section below.

One correction worth having in writing: several Mexican consultancies assert that the aviso must
explain the "lógica general" of automated processing. **That duty is not in the LFPDPPP.** Art. 15's
six fracciones say nothing about it — it is GDPR art. 13(2)(f) imported by habit. The real hooks are
art. 14 ("existencia y características principales del tratamiento") and art. 26 II. Disclosing the
logic anyway is cheap and defensible; just do it knowing it is best practice, not a citation.

## 3. Recolección: where consent is actually taken

Three surfaces, three different titulares, and only the first is Xangarro's own:

1. **El dueño** (registro) — aviso simplificado A + expreso checkbox, separate from términos,
   unticked. Already drafted.
2. **Los operadores** (NIP) — the negocio is responsable, Xangarro encargado. Variante C exists;
   OQ-L3 asks whether to keep it. Keep it: an operador whose shifts, cortes and messages are stored
   deserves to be told, and it costs one screen.
3. **Los clientes del negocio** (cuentas por cobrar) — data Xangarro never collected from the
   titular. Art. 17 puts the duty on whoever is responsable, which is the negocio. The honest move
   is the **plantilla de aviso** for the negocio to hand its own customers (OQ-L16). The draft is
   nervous about the liability; ship it as a clearly-labelled template with a disclaimer — the
   alternative is thousands of negocios with no aviso at all, which is worse for everyone including
   Xangarro.

## 4. AI usage (el Asesor): the section that does not exist yet

State of the code: `model.ts` is the only module that knows a model exists, it is gated on two env
vars, and **no caller wires it yet** — production is still the ADR-059 «Próximamente» gate and the
deterministic detectors in `domain/src/asesor/`. So today's assumption 12 in the N-34 README ("ningún
proveedor de modelos recibe datos personales hoy") is still literally true. It stops being true the
day a caller lands, and the aviso must change **before** that, not after (art. 11).

What the IA section needs, in priority order:

1. **What goes to the model.** The architecture's own virtue is the answer: figures are computed by
   `@xangarro/domain` and handed to the model as data; the model never derives a number. Say which
   fields travel (aggregates and detector outputs) and which never do — client names, phone numbers,
   free-text notes. If tenant strings do travel, say so; the boundary comment already treats them as
   untrusted data for injection purposes, which is a different question from disclosure.
2. **Who the provider is, where, and for how long.** The owner chose **Azure AI Foundry**
   (2026-09-22), which is more complicated than it looks and must be written correctly:
   - Claude in Foundry is a **third-party Marketplace offering**, not a "model sold by Azure". The
     familiar Azure OpenAI privacy commitments do **not** govern it. Microsoft's own page is
     explicit: _"Anthropic is the seller and operator of Claude models in Microsoft Foundry and acts
     as an independent data processor for prompts and outputs."_
   - So §6.1 gains **two rows, not one**: Microsoft (Foundry platform, billing, usage and contact
     data, under the Microsoft Products and Services DPA) and Anthropic (prompts and outputs, under
     Anthropic's own DPA and Commercial Terms). Microsoft states it _may share_ customer contact,
     transaction and usage information with Anthropic.
   - **Azure OpenAI Zero Data Retention does not extend to Claude in Foundry.** Do not let anyone
     write that it does.
   - Microsoft's Claude page states **no retention period in days at all** — it defers to Anthropic's
     terms. The publishable number therefore comes from Anthropic's DPA (commercial baseline: no
     training on customer content, 30-day retention), and it should be confirmed in writing for the
     Foundry path before it appears in the aviso.
   - Trust & Safety is the exception to "Anthropic never reads it": automatic safeguards may flag
     content and _"Anthropic personnel review customer content on an exceptions-only basis"_. That is
     one sentence in the aviso, not a silence.
   - **The hosting option is a residency decision taken at deploy time** (D-1b below).
3. **No training, stated as a commitment**, not merely inherited from a vendor's default.
4. **Human review and no legal effects** — art. 26 II is triggered by automated processing that
   evaluates "situación económica" _sin intervención humana_. The Asesor does exactly that. Two
   defences, and the product should have both: the output is advice the dueño acts on (no automated
   effect), and Configuración → Privacidad carries a switch that turns the Asesor off.
5. **Not fiscal or accounting advice** — `terms.md` §4 already says this for the NIF calculations.
   The IA section must repeat it, because an LLM writing prose about your finances reads more like
   advice than a table does.
6. **Local dev must never see tenant data.** `ASESOR_LLM_BASE_URL` pointing at a personal proxy with
   a real tenant's figures would be an undisclosed transfer to an undisclosed processor. Worth an
   explicit rule, and worth a guard in the code.

## 5. Third parties and analytics: the answer is "none", and that is an asset

Verified across every `package.json`: no Google Analytics, no Vercel Analytics, no Speed Insights,
no PostHog, no Plausible, no advertising SDK, no ATT-relevant tracker. Analytics is **first-party,
server-side, cookieless and aggregate**. Sentry is the only telemetry vendor, opt-in on mobile
(ADR-027) and always-on server-side with `business_id` as a tag.

So §10 should stop hedging. Replace the placeholder with: strictly-necessary cookies in the portal,
local storage in the caja web, a cookieless counter on the landing page, no third-party analytics,
no advertising cookies. On that basis **no cookie banner is required** — which is itself worth
knowing before someone adds one defensively.

The processors that do exist still need their `[PAÍS]` cells filled (PRIV-3P-02) and a signed DPA
each (Supabase, Vercel, Sentry, Stripe, the mail provider, the PAC, and the model gateway). That
list is the one the `xangarro.mx/privacidad/proveedores` page renders, so it should live as data in
the repo, not as prose in two places.

## 6. Store declarations (not asked, but blocking)

Apple requires Privacy Nutrition Labels covering third-party SDK behaviour, plus privacy manifests
for SDKs that declare them (Sentry does). Play requires a Data Safety form, and mismatches between
the form and observed SDK behaviour are a common rejection and takedown cause. Neither exists in
`docs/store/`. Both must be derived from the same source of truth as §3 of the aviso — if they are
written independently they will disagree, and the disagreement is what gets enforced.

Play's generative-AI policy also applies once the Asesor ships: the app must not be a thin wrapper
over a model (it is not — the detectors are the product) and must offer a way to report offensive
output. A "¿te sirvió?" control on each insight satisfies that and is useful anyway.

## 7. Recommended order of work

1. **PRIV-IA-02** — the provider is decided; what remains is the hosting option (D-1b), the two
   DPAs (Microsoft + Anthropic), and written confirmation of the retention figure. §4 is unblocked.
2. **PRIV-GEO-01 / ATR-01 / 3P-01 / 3P-02** — close the §3, §6.1 and §10 placeholders. Cheap, no
   decisions needed beyond the provider countries.
3. **PRIV-OPS-01** — build the machinery the aviso promises: ARCO intake without a session,
   self-service deletion, the retention calendar, the breach protocol. This is the long pole.
4. **PRIV-IA-01 / IA-03** — write the IA section and ship the Asesor off-switch, before any caller
   wires the model.
5. **PRIV-ST-01** — store declarations, generated from the §3 table.
6. **L-05 rewrite of the ToS** (§8) — now also carrying LFPC 76 Bis VIII–IX and the AI flow-down
   clause. Its renewal notice and cancel control share machinery with step 3, so schedule them
   together rather than twice.
7. **Legal review of the whole set**, which is N-34's acceptance criterion and unchanged.

## 8. Terms of service and the rest of the legal set

**Yes — and the ToS is the most out-of-date document in the repo.** `docs/legal/terms.md` (2026-04-24)
is not merely stale in branding; it is a contract for a product that is no longer sold. It says the
app "funciona por defecto en modo local", that cloud sync "depende del proveedor de base de datos que
configures", offers a free shared instance under fair use, contacts `soporte@cachink.mx`, and caps
liability at "cero, si no has pagado nada". ADR-053 made the cloud the backbone and there is now a
paid subscription billed through Stripe with CFDI. A liability cap that references a product you do
not sell is worse than no cap. L-05 already carries the rewrite; it is unscheduled.

**What forces the rewrite now — LFPC art. 76 Bis, fracciones VIII y IX (DOF 12-12-2025, in force
13-12-2025).** This reform post-dates every legal document in the repo and lands squarely on a
subscription business:

- **Express, informed consent** before any recurring charge, stating its existence, frequency, amount
  and billing date.
- **Notice at least five business days before each automatic renewal**, with the ability to cancel
  without penalty. A renewal made without that notice is challengeable and legally ineffective.
- **A mechanism to cancel immediately** — cancellation must not be harder than subscribing.
- Adhesion contracts carrying subscription terms must be updated, and re-registered with PROFECO
  where registration applies.

Two of those are **product work, not drafting**: a renewal-reminder email on a five-business-day
timer, and a self-service cancel control in the portal. The cancel control is the same missing
machinery as PRIV-OPS-01's "eliminar cuenta", so build them together.

**The rest of the set, by whether it exists:**

| Piece                                            | State                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Aviso de privacidad (integral + simplificados)   | Drafted, now updated for geo, attribution, analytics and IA. Pending legal review.                                                                                                                                                                                                                                                                                              |
| Procedimiento ARCO                               | Drafted; the machinery behind it is not built (PRIV-OPS-01).                                                                                                                                                                                                                                                                                                                    |
| Anexo de encargado (DPA con el negocio)          | Drafted in `encargado-clausulas.md`; must be **attached to the ToS**, not left loose.                                                                                                                                                                                                                                                                                           |
| **Términos y Condiciones**                       | Old text is for the wrong product. **Rewrite drafted 2026-09-22** in `docs/legal/aviso/terminos-borrador.md` (L-05), carrying LFPC 76 Bis VIII–IX, the AI clause and Anexo A. Pending legal review; replaces `terms.md` on approval. OQ-T1…T8 answered and applied (`respuestas-oq-borrador.md`).                                                                               |
| **Cláusula de uso de IA en los Términos**        | **Drafted** (borrador §6). Anthropic's Commercial Terms require customers to use reasonable efforts to make their end users comply with the Usage Policy, and the High-Risk Use Case requirements for consumer-facing **financial** use ask for human oversight and AI disclosure. The Asesor is exactly that, so the ToS needs a flow-down clause plus "not financial advice". |
| **Política de cancelación y reembolsos**         | **Drafted** (borrador §9). Web/Stripe refunds are yours to own; in-app purchases are Apple's or Google's. The two rules differ and users will read one policy.                                                                                                                                                                                                                  |
| **Apple Guideline 3.1.2 surfaces**               | **Missing.** Auto-renewable subscriptions must show title, length and price, and carry **functional links to the Terms of Use (EULA) and the privacy policy inside the app binary** and in App Store Connect. That means both documents need stable public URLs before submission.                                                                                              |
| DPAs signed with providers                       | None on file. The list now includes **Microsoft and Anthropic** alongside Supabase, Vercel, Sentry, Stripe, the mail provider and the PAC.                                                                                                                                                                                                                                      |
| Plantilla de aviso for the negocio's own clients | Not written (D-5).                                                                                                                                                                                                                                                                                                                                                              |
| Política de divulgación de vulnerabilidades      | Missing. Cheap, and it pairs with the art. 19 breach duty.                                                                                                                                                                                                                                                                                                                      |
| SLA / compromiso de disponibilidad               | None. Optional, but the current ToS disclaims everything while you now hold the customer's only copy of their books.                                                                                                                                                                                                                                                            |
| Third-party licenses                             | `THIRD_PARTY_LICENSES.md` exists.                                                                                                                                                                                                                                                                                                                                               |

**The precondition nobody can work around:** the aviso still says `[RAZÓN SOCIAL]` and `[DOMICILIO]`.
Art. 15 I requires the responsable's identity and domicile; a legal entity is also what signs the
Microsoft and Anthropic DPAs and what PROFECO would register. Until that entity exists and is named,
none of these documents can be published — only drafted. It is the cheapest item on this list to
start and the longest to finish.

## 9. The planned credit upsell — decide now, not in a year

The owner's plan (not committed): later use the collected data to offer credit through **another
company**. The instinct is to leave it out of today's documents and change them in a year. That is the
one option the statute closes off, and the reasoning is worth having on the record.

**A later aviso change does not license the data you already hold.** Art. 11: _"si el responsable
pretende tratar los datos para una finalidad distinta a las establecidas en el aviso de privacidad, se
requerirá obtener nuevamente el consentimiento"_. So "change it in a year" is not a documentation
task, it is a **re-consent campaign** against your whole installed base — and you would be betting the
credit line on the opt-in rate of an email to people who signed up for bookkeeping.

**Silence is worse than neutral.** Art. 6 forbids obtaining data through deceptive means and requires
privileging _"la expectativa razonable de privacidad, entendida como la confianza que deposita
cualquier persona en otra"_. Art. 12 limits treatment to what is necessary and relevant **to the
finalities in the aviso**. Collecting a business's books now, while planning a lender referral and not
saying so, is exactly the fact pattern those two articles describe. Looking backwards, an undisclosed
plan turns ordinary retention into retention beyond the declared purpose.

**But a blanket consent today would not work either** — and this is the part that usually gets
oversold. Art. 35 requires communicating the aviso and the finalidades **to the third party**, carrying
a clause on whether the titular accepts the transfer, and the receiving party _"asumirá las mismas
obligaciones que correspondan al responsable que transfirió los datos"_. You cannot validly obtain
consent today to transfer financial records to an unnamed lender on unstated terms. A checkbox that
tries reads as consent theatre, and it would also break the §6.2 promise ("no vendemos ni rentamos tus
datos") that is currently one of the strongest lines in the document.

**So: three layers, two of them free today.**

1. **Declare the finality now, opt-in, off by default.** Added as §4.2 d): analysing the titular's own
   records to see whether they might qualify, and telling them. This is analysis _inside_ Xangarro with
   no transfer to anyone. It cures arts. 6, 11 and 12 — the purpose is declared from day one, the
   retention is justified, nothing is hidden — and it costs one unticked checkbox.
2. **Keep the transfer as a separate, later, specific consent**, obtained when the lender is named, per
   art. 35. Design for it now: add `financiamiento` to the `purpose` values of the `privacy_consents`
   ledger the N-34 README already proposes, so switching it on later is a consent screen plus config,
   not a schema migration plus a legal reset.
3. **Design so the books never leave — and so Xangarro never judges.** Per the owner (2026-09-22)
   there is no eligibility computation at all: an opt-in section shows authorised entities' own
   offers, the dueño taps "quiero que me contacten", and only their contact details cross the
   boundary to the entity they named. That keeps §6.2 true forever, keeps art. 26 II out of the
   picture (no automated evaluation of _situación económica_), and it is the only framing in which
   art. 36 IV (_"contrato… por celebrar en interés de la persona titular"_) does honest work instead
   of being stretched to cover marketing. The regulatory side of the same design is in §10.5.

**Three consequences to plan for, whichever way this goes:**

- **Art. 26 II again, harder.** Eligibility scoring is automated evaluation of _situación económica_ —
  the paradigm case, not the edge. It needs a human step or a real opt-out, disclosed.
- **Art. 35's last sentence makes the lender's compliance partly your exposure.** Diligence and a
  contract, not just an introduction.
- **Art. 10, párrafo tercero (72 meses)** starts to matter if credit performance data ever flows back.
- **Possibly outside data protection entirely:** introducing customers to a lender for consideration
  can be a regulated activity depending on how it is structured (comisionista, corresponsal, or plain
  advertising), with CONDUSEF and LFPC advertising rules in scope. A question for the abogado, flagged
  and not answered here.

**Owner's decision (2026-09-22): deferred — §4.2 d) removed from v1.** Reasonable given the model
chosen: the future feature uses giro/antigüedad and user-requested contact data, never the books, so
the art. 6/12 "collected under a hidden plan" concern largely evaporates and the later cost is an
in-app consent toggle for a new finalidad (art. 11), not a re-consent of financial data. The analysis
above stays as the design brief for that day.

## 10. Second pass — the rest of the legal exposure, by who would sue

Everything above is the aviso and the ToS. This pass asked a different question: **who could
plausibly bring a claim or a sanction, and is there a document or a control standing in the way?**
Ordered by how cheap the fix is relative to the exposure. `[done]` = drafted today; `[task]` = build
or decide; `[verify]` = confirm a fact.

### 10.1 The stores (will reject, not sue — but it stops launch)

| Item                                                            | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | State                                                |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Account deletion — **web yes, in-app not required** (corrected) | Apple 5.1.1(v) and Play's policy trigger on **in-app account creation**. The mobile app pairs a device and takes a dueño-issued NIP; no account is created there, so neither rule applies. What remains: self-service deletion **in the portal** (LFPDPPP arts. 21–24, LFPC 76 Bis IX), an in-app **"Desvincular y borrar datos de este dispositivo"** (aviso §7 admits unlinking does not wipe), never adding Sign in with Apple/Google to the app, and reviewer notes explaining the model. | `[task]` PRIV-OPS-01 (portal) · `[task]` device wipe |
| Terms + privacy URLs live and linked in the binary              | Guideline 3.1.2 for subscriptions. Landing and portal currently have **no legal links at all** (verified: no `privacidad`/`terminos` anywhere in `apps/landing/src` or the portal shell).                                                                                                                                                                                                                                                                                                     | `[task]`                                             |
| Privacy Nutrition Label / Data Safety form                      | PRIV-ST-01. Derive from the aviso §3 table so they cannot disagree.                                                                                                                                                                                                                                                                                                                                                                                                                           | `[task]`                                             |
| **Open-source notices in the app**                              | MIT/BSD/Apache require the notice to accompany a distributed binary. Scan today: 1,184 production packages, **no AGPL/SSPL/GPL-only**; 2 `Unknown` to resolve (`@tamagui/native` rc, `buffers`); FSL-1.1-MIT (Sentry) permits this use. `THIRD_PARTY_LICENSES.md` covers assets only. Generate a "Licencias de código abierto" screen from `pnpm licenses list`.                                                                                                                              | `[task]`                                             |

### 10.2 The consumer (PROFECO, and the reform that just landed)

| Item                                                                      | Why                                                                                                                                            | State                            |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Address, phone and complaint channel **before** contracting               | LFPC art. 76 Bis III. Must be on the pricing/checkout path, not only in the ToS.                                                               | `[task]` landing + checkout      |
| Total price with IVA, charges, payment methods before purchase            | 76 Bis V. The landing shows "+ IVA"; the checkout must show the peso amount.                                                                   | `[verify]`                       |
| Recurring-charge consent, 5-business-day renewal notice, one-click cancel | 76 Bis VIII–IX. Drafted in ToS §8; needs the email timer and the cancel token.                                                                 | `[done]` text · `[task]` product |
| Price increases need **express** re-acceptance, not just notice           | 76 Bis VIII binds the consented amount. ToS §7 now says so.                                                                                    | `[done]`                         |
| Marketing only by opt-in; honour REPEP if phone/SMS is ever used          | 76 Bis VI and LFPC art. 18; the aviso's separate unticked checkbox already does this.                                                          | `[done]`                         |
| Truthful advertising                                                      | LFPC art. 32. Landing claims like "Tu negocio sigue aunque se vaya el internet" are demonstrable; avoid "cumple con el SAT" or "100 % seguro". | `[verify]` copy                  |
| Whether the dueño is a "consumidor" at all                                | LFPC art. 2 I limits business users to arts. 99/117. Comply in full regardless; ask the lawyer (OQ-N1).                                        | open                             |

### 10.3 The titular (Secretaría Anticorrupción y Buen Gobierno)

| Item                                                                               | Why                                                                                   | State      |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------- |
| Breach protocol with the art. 65 field list and a named person (art. 29)           | The aviso promises "de inmediato". Without a runbook that promise is the liability.   | `[task]`   |
| `security.txt` + vulnerability-disclosure page                                     | Cheap; turns a researcher's email into a controlled process instead of a public post. | `[task]`   |
| Consent ledger with version + hash; optional NOM-151 seal                          | Prueba del consentimiento is on you (Reg. art. 39 by analogy). OQ-N3.                 | `[task]`   |
| Sentry server-side: confirm no PII before the aviso says so                        | B-18 claim is unverified.                                                             | `[verify]` |
| Signed DPAs: Supabase, Vercel, Sentry, Stripe, mail, PAC, **Microsoft, Anthropic** | The aviso names them as encargados; the contracts are what make that true.            | `[task]`   |
| Plantilla de aviso for the negocio's own customers                                 | L16 — ship it.                                                                        | `[task]`   |

### 10.4 The negocio's customer (your customer's customer)

| Item                                                         | Why                                                                                                                                                                                                                                                                                                                                          | State               |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| **"Este comprobante no es un CFDI" legend on every receipt** | Verified: the comprobante strings (`es-mx.ts` `comprobante.*`) carry no such line. A shopper who believes they hold a factura, or a negocio that hands "comprobantes" in place of CFDI, is a SAT problem that lands on Xangarro's reputation and possibly on its liability for the tool's design. One i18n string + one line in the PNG/PDF. | `[task]`            |
| Receipt shows the negocio's name, not Xangarro's, as issuer  | Otherwise Xangarro looks like the seller of record.                                                                                                                                                                                                                                                                                          | `[verify]` template |

### 10.5 The regulator you were not thinking about (CNBV / CONDUSEF)

| Item                                                                                   | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | State                  |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **Credit referral — deferred by owner; when it comes, be the medium, not the offeror** | Owner's model (2026-09-22): no scoring, no pre-approval, no funds — connect interested users with **authorised** entities. Comisionista status is for performing art. 46 banking operations for a bank; a user-requested contact is not one. The live risk is the CNBV notice's word _"promover"_: stay the **advertising medium** (entity's own offer, identity, CAT and legal text; user initiates contact; only contact data leaves; compensation from the entity under an advertising/lead-generation contract, not a comisión mercantil; entities verified in the CNBV padrón or SIPRES). Never say "podrías calificar". Full structure in `respuestas-oq-borrador.md` OQ-N2. | open — lawyer confirms |
| "No somos entidad financiera"                                                          | Added to ToS §3. Keep it true: never hold balances (Ley Fintech is one wallet feature away).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `[done]`               |

### 10.6 Intellectual property (the one that forces a rebrand)

| Item                                                   | Why                                                                                                                                                                                                                                                                                                                                            | State                    |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| **IMPI trademark clearance and filing for "Xangarro"** | ADR-054 is "accepted, pending IMPI clearance". Launching on an uncleared mark is the single most litigable exposure in this list: an opposition or infringement claim means a forced rebrand of app, stores, domain and legal texts. Search + file in classes 9, 35, 36 and 42 **before** public launch; register domain variants and handles. | `[verify]` then `[task]` |
| INDAUTOR software registration                         | Optional, cheap, evidentiary in an authorship dispute.                                                                                                                                                                                                                                                                                         | optional                 |
| Images, illustrations and fonts                        | `THIRD_PARTY_LICENSES.md` covers sounds and map data. The taquero hero and any stock/AI imagery need a recorded licence; OFL fonts are fine unmodified.                                                                                                                                                                                        | `[verify]`               |

### 10.7 Governance

| Item                      | Why                                                                                                                     | State    |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------- |
| Legal entity named (D-6)  | Precondition for every document above and every DPA.                                                                    | open     |
| Cyber-liability insurance | Not a legal requirement; the practical backstop for a breach affecting thousands of negocios' books. Business decision. | optional |
| Beta program terms        | `docs/beta/` exists; ToS §18 now covers beta participants.                                                              | `[done]` |

**Reading of the whole list:** nothing here is exotic. The pattern is that the _documents_ are now
largely drafted and the exposure has moved to **controls the documents promise** — delete account,
cancel in one click, renewal email, breach runbook, receipt legend, trademark filing. Those are
sprint items, and they are the difference between a policy and a defence.

## 11. Open decisions for the owner

- **D-1. Model provider of record** — **resolved 2026-09-22: Azure AI Foundry.** `model.ts` needs no
  change; the credential lands in the existing two env vars.
- **D-1b. Foundry hosting option — the real decision now.** _Hosted on Azure_ keeps ingress, inference
  and data at rest in the chosen Azure geography (scoped by the Global/DataZone deployment type);
  _Hosted on Anthropic infrastructure_ means data _"might be processed outside of Azure including
  outside of your selected Azure region"_. Recommend **Hosted on Azure with a US DataZone**: it is
  the only option that lets the aviso state a processing geography truthfully, and it keeps the same
  US answer already given for Supabase and Vercel rather than adding an unbounded one.
- **D-2. Attribution retention** — geo prunes at 400 days; `signup_attribution` has no rule. Propose
  the same 400 days, or dissociate the region after the campaign is measured.
- **D-3. Landing aviso surface** — a footer link on `xangarro.mx` plus a line about the counter. The
  beacon fires before any link is clicked, so the honest framing is disclosure, not consent.
- **D-4. Asesor off-switch** — confirm it is a product requirement, not just a privacy one.
- **D-5. Plantilla de aviso for the negocio's own customers** — ship or withhold (OQ-L16).
- **D-6. Razón social y domicilio.** Naming the legal entity is the precondition for publishing
  anything and for signing the Microsoft and Anthropic DPAs (§8).
- **D-7. Crédito (§9).** Ship §4.2 d) now (recommended), or leave the finality undeclared and accept
  that enabling it later means re-consenting the whole installed base. Also: is the referral designed
  so the books never leave Xangarro?
- **D-8. PROFECO.** Whether a contrato de adhesión for this service falls in a mandatory-registration
  category, or only has to meet the LFPC content rules. One question for the abogado, with a concrete
  consequence for the ToS.

## Sources

All consulted 2026-09-22. Statute text extracted from the official PDF and read directly.

| Source                                                                                                                                                                                                                                   | What it settled                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LFPDPPP, Cámara de Diputados (DOF 20-03-2025, última reforma **14-11-2025**)                                                                                                                                                             | Art. 7 (financieros/patrimoniales → consentimiento expreso), art. 14, art. 15 I–VI (**no automated-logic duty**), art. 16 II, art. 26 II (oposición a tratamiento automatizado que evalúa la _situación económica_ sin intervención humana), art. 10 (supresión previo bloqueo; 72 meses).                                               |
| Sharkit; EY México; Hogan Lovells; Greenberg Traurig; KPMG México                                                                                                                                                                        | The **Reglamento of the 2025 law is still unpublished** as of mid-2026; the 2011 Reglamento applies supletoriamente. Authority is the Secretaría Anticorrupción y Buen Gobierno.                                                                                                                                                         |
| CMS Expert Guide; Legal500 Mexico AI guide; Basham legislative alert                                                                                                                                                                     | **No comprehensive Mexican AI law in force**; a federal bill (CONAIA, risk-based) was filed 2026-02-11 and is in committee. Labor/copyright AI reforms passed 2026-04-07.                                                                                                                                                                |
| Microsoft Learn, _Data, privacy and security for Anthropic Claude models in Microsoft Foundry_ (updated 2026-06-23); _…for Foundry Models sold by Azure_ (2026-05-18); Microsoft Q&A on Claude retention (2026-04-29) and on Foundry ZDR | Claude in Foundry is a **partner Marketplace offering**; Anthropic is _"an independent data processor for prompts and outputs"_; Azure OpenAI ZDR does **not** cover it; **no retention period is stated** on the Microsoft side; two hosting options with different residency; Trust & Safety human review on an exceptions-only basis. |
| Anthropic platform docs and Commercial Terms                                                                                                                                                                                             | API baseline **30-day retention**, **no training on customer content**; ZDR negotiable on the direct API with safety-classifier carve-outs (and not via Foundry).                                                                                                                                                                        |
| Apple "App Privacy Details" and App Store Review Guideline 3.1.2; Google Play Data Safety and AI-generated-content policy pages                                                                                                          | Third-party SDK behaviour must be declared; Data Safety mismatches are an enforcement trigger; generative-AI apps need user reporting of offensive output; subscription apps need **functional Terms of Use and privacy-policy links in the binary and in App Store Connect**.                                                           |
| Reglamento LFPDPPP (DOF 21-12-2011), text extracted from the official PDF                                                                                                                                                                | Arts. 15 (expreso for financieros/patrimoniales), 37–39 (plazos, bloqueo, prueba), 49–53 (encargado, nube, remisiones, cuándo el encargado pasa a responsable), 64–66 (vulneraciones: "sin dilación", campos mínimos).                                                                                                                   |
| LFPA art. 28; CCom art. 1047; CCF art. 1159; LFPC arts. 2 I, 14, 18, 32, 76 Bis I–IX, 85–90, 111–122                                                                                                                                     | Business-day calendar; 10-year commercial/civil prescription; 1-year consumer prescription; abusive-clause list (art. 90: no liability waivers, no foreign courts, no rights waivers); e-commerce duties; PROFECO voluntary conciliation/arbitration.                                                                                    |
| Lineamientos del Aviso de Privacidad (DOF 17-01-2013)                                                                                                                                                                                    | Issued under the abrogated 2010 law; no express abrogation found; treated as non-binding practice.                                                                                                                                                                                                                                       |
| CNBV, "Aviso al público sobre los Comisionistas Autorizados" (2020-12-04, verified at gob.mx)                                                                                                                                            | Unlicensed third parties that promote or offer financial services face sanctions; only entities or authorised comisionistas may.                                                                                                                                                                                                         |
| Apple, "Minimum Terms of Developer's End-User License Agreement"; App Store Review Guidelines 3.1.2 and 5.1.1(v); Google Play account-deletion policy                                                                                    | Ten mandatory EULA terms; subscription link requirements; **account deletion is triggered only by in-app account creation** — not by Xangarro's device-pairing + NIP model.                                                                                                                                                              |
| `pnpm licenses list --prod` on this repo (2026-09-22)                                                                                                                                                                                    | 1,184 packages; no copyleft-only licences in production; two `Unknown` to resolve.                                                                                                                                                                                                                                                       |
| LFPC cap. VIII-Bis, art. 76 Bis VIII–IX (DOF 12-12-2025, in force 13-12-2025); PROFECO RPCA                                                                                                                                              | Express informed consent for recurring charges; **≥5 business days' notice before automatic renewal**, cancellable without penalty, or the renewal is ineffective; an immediate cancellation mechanism; adhesion contracts updated and re-registered where registration applies.                                                         |
| Anthropic Commercial Terms, Usage Policy and High-Risk Use Case Requirements                                                                                                                                                             | Customers must use reasonable efforts to make end users comply with the Usage Policy; consumer-facing **financial** use cases call for human oversight and AI disclosure — so the ToS needs a flow-down clause.                                                                                                                          |
