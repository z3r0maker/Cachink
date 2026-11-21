# Track G — Guías: aprender dentro del producto

> **Decisions settled with the owner, 2026-11-20 (ADR-163). Boards not approved yet.** No screen is
> coded before its board (G-01). The priorities are still a proposal.

The owner asked (2026-11-20) how people will learn Xangarro: short videos, and whatever has
replaced the old tutorial library. This track's answer: the product teaches in place, at the
moment someone is stuck. A short clip is a by-product of the tests we already run, and its voice
a by-product of the guide's own words. Nobody films or records anything by hand.

Half of this exists. The portal has «Ayuda» (ADR-107): a search, eleven answers and four of Don
Cuentas's guides. The phone and the web caja, where the first sale happens, have nothing. The
track gives the guides one home, records their clips from the test flows, and opens them where
the person already is.

## 1. Owner decisions (settled 2026-11-20, ADR-163)

Asked one at a time. Decisions 4 and 6 are the owner's own wording, not the recommendation.

1. **The phone's help button opens two cards:** «¿Cómo le hago?» and «Algo no funciona». One door
   for every kind of help, the way the portal's «¿Qué necesitas?» asks first (P-48). This changes
   what ADR-162 says the button opens, and its board `RpPuerta`. The report sheet behind the
   second card (`RpHoja`) stays as drawn.
2. **A practice shop («tienda de práctica»), later.** Agreed, after Phases 1 to 3. Nothing in it
   syncs, counts toward a limit or reaches a report, and every screen says it is practice.
   ADR-117's rule against fixture data on a live screen stands until G-40 writes the ADR that
   defines the mode.
3. **Clips are our own files inside the product, and YouTube carries the public copy** (L-10). In
   the product: no ads, no suggested videos, no leaving the app.
4. **Clips are narrated, everywhere.** The voice is Don Cuentas's: funny, in Mexican Spanish, and
   invented from a written description, never copied from a real person. The repo holds the line
   he says at each step and the description of his voice. The owner generates the audio on his own
   machine with Qwen3-TTS (its VoiceDesign model makes the one reference sample, its Base model
   says every line in that voice). The model is not a dependency of the repo.
5. **Asking in your own words waits.** The search is deterministic first. An AI answer comes
   after the same production gate as the Asesor (the DPA and Foundry rows of
   `production-readiness.md`), and only if G-22 shows searches that matching words cannot answer.
6. **No WhatsApp help line now.** It is kept for after the MVP, as automated customer service with
   AI (G-42). Until then a person answers, and G-13 shares guides by `wa.me` with no API, so row
   13 of Track N stands.
7. **The help remembers three things:** the guide opened, whether it was finished, and the words
   of a search that found nothing. Kept with the business, never with a person or a device, for
   90 days. The aviso de privacidad is checked before G-22 ships.

## 2. What exists today (verified on `main` at 088c3f3f)

- **Portal «Ayuda»** (`apps/web/src/app/(portal)/ayuda/`, N-08, ADR-107): six topics, eleven
  answers (`contenido.ts`), four guides (`guias.ts`) shown a step at a time with Don `caminando`
  (`guia-drawer.tsx`), a search that ignores accents (`buscar.ts`), and `ayuda.spec.ts`.
- **«¿Cómo empiezo?»** (`/como-empiezo`): the checklist, also a card on Inicio and in the menu.
- **The ⌘K palette** (`apps/web/src/shell/palette-search.ts`): it does not find guides.
- **Phone and web caja:** no help content. The only help entry planned is the report button of
  ADR-162 (M-23, P-48), drawn and not yet built.
- **Landing:** four articles (`apps/landing/src/articles.js`). L-10, a YouTube channel with one
  video per guide, waits for the owner.
- **Don Cuentas:** the poses `ayuda`, `caminando` and `senalando` exist on both surfaces
  (`docs/design/el-mostrador.md` §5). He has no voice yet.
- **Tests that already do the jobs a guide teaches:** 73 Maestro flows and 105 Playwright specs.
  `shared/create-venta.yaml`, `caja-abrir-cerrar.yaml`, `producto-quick-add.yaml` and
  `nuevo-producto.spec.ts` are a sale, a shift and a product, start to end.
- **Recording:** Maestro 2.12.1 has `maestro record --local <flow> <out>` (beta flag); Playwright
  records video natively (`video`), off today (`trace: 'retain-on-failure'` only). `ffmpeg` is on
  the dev machine.
- **Sharing:** `equipo/pairing-qr.tsx` already sends the pairing by `wa.me`.
- **Measuring:** Synth (Track S) records `never_discovered` per persona.

## 3. Constraints for every task

- **One home for a guide** (CLAUDE.md §2.3). Its words, its steps, the line Don says at each step,
  the screen it leads to and its clip are written once, in `@xangarro/guias`, and every surface
  reads them from there.
- **Canvas first** (ADR-117). No screen state is coded before its board is approved. Copy is
  worded as the board words it; the copy quoted in this file is a proposal. A spoken line is copy
  too.
- **Help never needs a connection.** The steps ship inside the app. A clip that is not there yet,
  or cannot load, leaves the steps alone on screen, with no placeholder and no «Pronto».
- **Don Cuentas:** one per screen, and to the operator he says how, never what the business
  should do. That holds for what he says aloud.
- **One voice.** Every line is said in the same voice, from the same reference sample. No real
  person's voice is recorded or copied.
- **Sound never starts by itself, and the words are always on screen.** A clip opens still and
  silent, with a button that plays it with sound. The step's words show while it plays, so it
  works with the phone muted, in a noisy shop and for someone who cannot hear (WCAG 1.4.2 and
  1.2.2). Under reduced motion it shows its poster and the steps. These two rules are this
  track's, not one of the owner's seven decisions.
- **Clips show invented data only.** They are recorded on a minted tenant (ADR-128) or the phone's
  E2E mode, never against production and never with a customer's rows.
- **No third-party onboarding SDK,** and no dependency without the §2.7 check.
- **Maestro runs take a lane** (ADR-157), recording included.

## 4. How a guide is made

The same seven steps for every guide, on every surface. Steps 4 to 6 are one command.

1. **Write it** in `@xangarro/guias`: a title and two to five steps. Each step has the words on
   screen, the line Don says, and the control it is about, named by its testID.
2. **Draw it only if it needs a new screen.** The boards of G-01 draw the guide's view once and
   every guide fills it. A guide that needs a state the boards do not have goes to the canvas
   first.
3. **Give it its voice.** `pnpm guias:voz` lists the lines whose audio is missing or older than
   their words. The owner runs the generator on his machine and the audio lands beside the guide.
4. **Record it.** A Maestro flow (phone) or a Playwright spec (portal, web caja) does the job on
   invented data while the screen is recorded.
5. **Cut it.** The script cuts the recording where each step starts, holds a step's last frame
   until its line has been said, lays the voice and the words over it, and writes the clip and its
   poster.
6. **Publish it** to the guide's stable address. The public copy for YouTube is a file the owner
   uploads.
7. **Keep it true.** The flow runs in the regression, so a screen that changed fails there. A
   line whose words changed fails the voice check. Either one means running steps 3 to 6 again.

## 5. Tasks

**Phase 0 — Decisions and boards**

### G-00 Las siete decisiones del dueño y su ADR [media]

- [x] Status · **Blocks:** G-01, G-02, G-40
- **Done 2026-11-20:** the seven decisions are §1 above and ADR-163.

### G-01 Boards: la página «Guías» del canvas [media]

- [ ] Status · **Blocked by:** — · **Blocks:** G-10, G-11, G-12, G-13, G-20, G-30
- **What:** a canvas page «Guías» with, at least:
  - the phone's help door with its two cards (it redraws `RpPuerta`), for the phone, the tablet
    rail and the sidebar;
  - the phone sheet «¿Cómo le hago?» in four states: the guides for this screen, a search with
    results, a search with none, and no connection;
  - a guide on the phone: the clip still, the clip playing with its sound button and the step's
    words, the steps, «Llévame ahí», and the same guide with no clip;
  - the same on the web caja;
  - the portal's guide drawer with a clip, and «Ver cómo» on an empty state and on a row of
    «¿Cómo empiezo?»;
  - «Enséñame»: Don `senalando` beside the real button, the last step that says what the tap
    will do, and how to leave;
  - the message «Mándale la guía por WhatsApp» next to the pairing code;
  - the public page of a guide on xangarro.mx.
- **Drawn 2026-11-20, approval pending:** boards `GuPuerta`, `GuHoja`, `GuGuia`, `GuEnsename`,
  `GuTableta`, `GuPortal`, `GuCaja` and `GuPagina`. Not drawn yet: «Enséñame» in the portal (G-21)
  and the console's list of missed searches (G-22); each is drawn when its task starts.
- **Acceptance:** every state above is drawn and approved by the owner. Tasks G-10 to G-30 quote
  the board ids.

**Phase 1 — One home for the guides, clips from the tests, and a voice**

### G-02 `@xangarro/guias`: las guías, sus pasos y su búsqueda en un solo paquete [media]

- [x] Status · **Blocks:** G-03, G-12, G-30
- **Done 2026-11-20:** `packages/guias` holds the eleven answers, the four portal guides, `plano`
  (the one accent folding, which the ⌘K palette now imports) and the search. `buscarEn` takes
  its source and a surface, so the caja's guides will not show in the portal; `buscar` stays the
  portal's. No portal guide is public yet (`publica: false`); G-30 turns them on. Verified: the
  package's 26 tests, the portal's unit suite, `ayuda-rutas.test.ts` (every link is a real page)
  and `ayuda.spec.ts` untouched and green against a production build.
- **What:** a zero-dependency package, like `@xangarro/tokens`. It takes `contenido.ts`,
  `guias.ts` and `buscar.ts` out of `apps/web`, which then imports them. A guide gains its
  surface (`portal` or `caja`), the screens it belongs to, whether it is public, and the id of
  its clip. A step gains the line Don says and the testID of the control it is about. The
  palette's accent folding and the search's become one function.
- **How:** no visual change, so no board. A guide on the phone ships inside the build: until
  there are OTA updates, changing its words waits for the next build.
- **Tests:** the search test-first (happy path + 3 unhappy: an empty search, a word with accents,
  a word no guide has). A test that every `ir` of a portal guide is a route that exists.
  `ayuda.spec.ts` stays green untouched.
- **Acceptance:** `apps/web` holds no guide text; `pnpm lint && pnpm typecheck && pnpm test` green.

### G-03 Las primeras ocho guías de quien cobra [media]

- [ ] Status · **Blocked by:** — · **Blocks:** G-04, G-07, G-10, G-11
- **What:** the operator's guides, written once for the phone and the web caja: abrir turno,
  cobrar una venta, cobrar con el escáner, registrar un gasto, llegó mercancía, dar de alta un
  producto, cancelar una venta, cerrar turno y contar la caja. Four steps or fewer each, short
  enough to read at the counter, and one spoken line per step of twelve words or fewer. The list
  is checked against Synth's `never_discovered` and the first support questions before it is
  closed.
- **Tests:** every guide has between two and five steps, a destination that exists on its
  surface, a spoken line per step, and no em dash.
- **Acceptance:** the owner has read the eight guides and approved the wording, written and
  spoken.

### G-07 La voz de Don Cuentas: su descripción, sus líneas y su audio [media]

- [ ] Status · **Blocked by:** G-03 · **Blocks:** G-04
- **What:** three things, in order.
  1. One description of the voice in words (a warm, playful shopkeeper from Mexico), kept in the
     package. The owner generates a reference sample from it with Qwen3-TTS VoiceDesign and
     approves it by ear. That sample is the voice from then on.
  2. `pnpm guias:voz` writes a list of the lines that need audio: the guide, the step, the text
     to say and the file to write. A runner the owner starts on his Mac reads the list and says
     each line with Qwen3-TTS Base and the reference sample.
  3. The audio is committed beside the guide, small (mono, compressed), with the hash of the words
     it was made from. `pnpm guias:voz --check` fails while a line has no audio or its words
     changed after its audio was made.
- **How:** lines are written to be spoken: amounts in words («ciento veinte pesos»), and the
  brand spelled the way the model says it right. The model, its weights and its Python
  environment stay outside the workspace; the runner is a script, not a package. Qwen3-TTS was
  Apache 2.0 on 2026-11-20: read the licence on its model card again the day this starts, and
  check how Mexican the accent comes out before generating all eight.
- **Tests:** the check test-first (happy path + 3 unhappy: a line with no audio, a line whose
  words changed, an audio file no line names).
- **Acceptance:** the eight guides have their audio in one voice the owner approved; changing a
  word turns the check red until that line is generated again.

### G-04 Clips del teléfono: un flujo de Maestro graba cada guía [media]

- [ ] Status · **Blocked by:** G-03, G-07 · **Blocks:** G-05
- **What:** one flow per guide under `apps/mobile/maestro/flows/guias/`, tagged `guia`, built
  from the shared subflows. A script records them in a lane and cuts each as §4 step 5 says: at
  most 45 seconds, 720 px wide, MP4 with the voice and the step's words on screen, plus a WebP
  poster, 2 MB or less.
- **How:** start with a spike on one flow. It answers two things: whether `maestro record --local`
  works in a lane (if not, record the simulator around a normal run with
  `xcrun simctl io … recordVideo` or `adb screenrecord`), and how the cut finds where each step
  starts (the run's own command log, or one recording per step). The flows also run in the
  regression, so a guide whose screen changed fails there before its clip goes stale. The Maestro
  README inventory is regenerated in the same change.
- **Tests:** a script test that every `caja` guide names a flow that exists, and that each flow
  touches the testIDs its guide's steps name. A test of the cut's arithmetic: a step shorter than
  its line is held, one longer is left alone.
- **Acceptance:** `pnpm guias:clips` produces the eight narrated clips from a clean lane with no
  hand editing. After a change of wording only that line's audio is generated again; the screen
  is recorded again only when the flow changed.

### G-05 Publicar los clips: dónde viven y cómo llegan [media]

- [ ] Status · **Blocked by:** G-04 · **Blocks:** G-06, G-30
- **What:** upload the clips to our own static hosting (decision 3), at one stable address per
  guide, so a clip recorded again reaches phones without a new build. The portal's CSP
  (`apps/web/src/server/security/csp.ts`) allows that origin for media and nothing else.
- **How:** clips are build output, not source: they are not committed. Vercel deploys are manual,
  so the upload is its own step of the release script.
- **Tests:** a CSP test for the one new origin; a script test that the upload refuses a clip over
  the size or length limit, and one with no voice.
- **Acceptance:** a guide's clip plays in the portal and on a phone build from the public
  address; replacing the file changes what both show.

### G-06 Clips del portal y de la caja web: un proyecto de Playwright que graba [baja]

- [ ] Status · **Blocked by:** G-05 · **Blocks:** —
- **What:** a `clips` project in `apps/web/playwright.config.ts` with video on, a fixed viewport
  and a human pace, for the four portal guides and for the eight operator guides on the web caja.
  Each spec mints its own tenant (`mintTenant()`, ADR-128) and composes believable rows from
  `tenant-rows.ts`. The portal guides get their spoken lines the way G-07 gives the operator's.
  Same cut, limits and publishing as G-04 and G-05.
- **Acceptance:** the portal guides and the web caja's have a narrated clip produced by one
  command.

**Phase 2 — Help where the person is**

### G-10 Teléfono: «¿Cómo le hago?» detrás del botón de ayuda [media]

- [ ] Status · **Blocked by:** G-01, G-03 · **Blocks:** G-20, G-22, G-23
- **Design first:** boards `GuPuerta`, `GuHoja` and `GuGuia`, and `GuTableta` for the tablet, where
  the door, the list and the guide are dialogs and the clip is the phone's. **Approval pending: no
  code before it.**
- **What:** the two cards of decision 1, and behind the first the sheet «¿Cómo le hago?». It
  lists first the guides of the screen the person is on, then searches all of them. A guide shows
  its clip when there is one, its steps always, and «Llévame ahí», which opens the screen where
  the job is done.
- **How:** M-23 ships the help button with the report sheet behind it. This task puts the two
  cards between them and updates M-23's flows (`bug-report-sheet.yaml`, `bug-report-enviar.yaml`)
  in the same change. Components in `packages/ui`, content from `@xangarro/guias`. The video
  player is a new dependency: check the latest stable `expo-video` first (§2.7). Loading, empty,
  error and with-data states, as the boards draw them.
- **Tests:** a Maestro flow (`guias-como-le-hago.yaml`) with the shared subflows: open the door
  from Cobrar, see the Cobrar guide first, search «gasto», open the guide, land on Gastos. A
  second flow with no connection: the steps are there.
- **Acceptance:** from any tab, two taps reach a guide for that tab; in airplane mode the steps
  still open; no clip makes a sound before its button is tapped.

### G-11 Caja web: la misma puerta y las mismas guías [media]

- [ ] Status · **Blocked by:** G-01, G-03 · **Blocks:** —
- **Design first:** board `GuCaja`, four states. **Approval pending: no code before it.**
- **What:** the same door and guide view in `apps/web/src/operador/`, vanilla-extract over
  tokens, reading the same `caja` guides. A guide shows its steps alone until G-06 has recorded
  the web caja's clip; a phone clip is never shown on the web caja.
- **Tests:** Playwright in the `operador` project: the guide's steps reach the page and «Llévame
  ahí» lands on the right screen.
- **Acceptance:** a guide reads the same, word for word, on the phone and the web caja.

### G-12 Portal: las guías con su clip, y tres entradas nuevas [media]

- [ ] Status · **Blocked by:** G-01 · **Blocks:** G-21
- **Design first:** board `GuPortal`, its first three states. **Approval pending: no code before
  it.** «¿Cómo empiezo?» keeps its own wording for the button, «¿Cómo se hace?».
- **What:** the guide drawer plays the guide's clip. Three new ways in: «Ver cómo» on the empty
  states that have a guide, «Ver cómo» on each row of «¿Cómo empiezo?», and the ⌘K palette
  finding guides by the same search.
- **Tests:** extend `ayuda.spec.ts`; a spec on a minted tenant with no products asserts the empty
  state opens the «Agrega tu primer producto» guide with its real steps.
- **Acceptance:** every portal guide can be reached from the screen it is about, not only from
  «Ayuda».

### G-13 «Mándale la guía por WhatsApp» al dar de alta a quien cobra [media]

- [ ] Status · **Blocked by:** G-01, G-30 · **Blocks:** —
- **Design first:** board `GuPortal`, state «Mandar por WhatsApp». **Approval pending: no code
  before it.**
- **What:** next to the pairing code, the owner sends the new operator the three guides they
  need first (abrir turno, cobrar, cerrar turno) as links to their public pages. A `wa.me` link,
  no API, the owner picks the contact (`equipo/pairing-qr.tsx` already does this for the code).
- **Tests:** Playwright: the link carries the three public addresses and nothing about the
  business.
- **Acceptance:** an operator who never opened the portal can watch the three clips from the
  message, with no account.

**Phase 3 — «Enséñame», and knowing what is missing**

### G-20 «Enséñame» en el teléfono: Don señala el botón de verdad [media]

- [ ] Status · **Blocked by:** G-01, G-10 · **Blocks:** G-21, G-40
- **Design first:** board `GuEnsename`, three states. **Approval pending: no code before it.**
- **What:** from a guide, «Enséñame» walks the job on the live screen: Don `senalando` beside
  the real control, the step's words, and the person does the tapping. It never taps for them.
  The last step says what the tap will do («Si tocas Cobrar, la venta queda registrada») and can
  be left without doing it.
- **How:** each step names its target by the testID the Maestro flow already uses, so the guide,
  its clip and its walk-through cannot drift apart (G-04's test covers the three). Our own
  overlay; a tour library only with the owner's approval.
- **Tests:** a Maestro flow that follows «Enséñame a cobrar» to the last step and leaves without
  selling; one that finishes it and finds the sale in Ventas.
- **Acceptance:** a person who has never opened the app makes a sale by following Don, with no
  video and no reading beyond one line per step.

### G-21 «Enséñame» en el portal [baja]

- [ ] Status · **Blocked by:** G-12, G-20 · **Blocks:** —
- **Design first:** not drawn yet. Its board joins the page «Guías» before any code.
- **What:** the same walk-through for the portal's guides, starting with «Conecta la caja de
  quien cobra» and «Agrega tu primer producto».
- **Acceptance:** each row of «¿Cómo empiezo?» can be done by following Don.

### G-22 Qué buscó la gente y no encontró [media]

- [ ] Status · **Blocked by:** G-10 · **Blocks:** G-41, G-42
- **What:** keep what decision 7 allows, and show the staff console the searches with no result
  and the guides people abandon, by week. That list is where the next guides come from.
- **Design first:** the console's list is not drawn yet. It goes on the Consola canvas before any
  code.
- **How:** portal first, a portal-only table through `docs/new-entity-checklist.md`. The phone
  half needs a contract task (`C-`) before any code; write it when this starts.
- **Tests:** an integration test that builds its own rows; the 90-day purge; a search with a
  result stores no text.
- **Acceptance:** the console lists last week's unanswered searches, with no name and no amount.

### G-23 Synth mide si la ayuda sirve [baja]

- [ ] Status · **Blocked by:** G-10, S-11 · **Blocks:** —
- **What:** run Synth's phone scenarios with the help door reachable and without it, and report
  the difference in tasks finished and in `never_discovered`. Deltas only, as Track S requires.
- **Acceptance:** a report says which guides changed an outcome and which nobody opened.

**Phase 4 — Outside the product**

### G-30 Una página pública por guía en xangarro.mx [media]

- [ ] Status · **Blocked by:** G-01, G-05 · **Blocks:** G-13, G-31
- **Design first:** board `GuPagina`. **Approval pending: no code before it.** The landing's own
  header and footer are not redrawn there.
- **What:** `/guias/<id>/` on the landing for every public guide, prerendered from
  `@xangarro/guias`: the clip, the steps, a CTA. Each is an entry in `src/routes.js`, in the
  sitemap and in `llms.txt`.
- **Acceptance:** the Lighthouse job green; a guide edited in the package changes its page on the
  next deploy with no second edit.

### G-31 Los mismos clips en YouTube, TikTok y Reels [baja]

- [ ] Status · **Blocked by:** G-30, L-10 · **Blocks:** —
- **What:** the phone clips are already vertical, narrated and captioned. A script adds a title
  card and writes the file and its description. The owner uploads; nothing posts on its own.
- **Acceptance:** the channel has one video per public guide, and each public page embeds or
  links its own.

**Phase 5 — Later, each behind its decision**

### G-40 Tienda de práctica [baja]

- [ ] Status · **Blocked by:** G-20 · **Blocks:** —
- **What:** decided 2026-11-20: yes, after Phases 1 to 3. It starts with its own ADR, which
  defines the mode and amends ADR-117, and with its boards.
- **Acceptance:** a sale made in practice appears in no report, no sync push and no limit count,
  proven by a test on each of the three.

### G-41 Preguntar con tus palabras [baja]

- [ ] Status · **Trigger:** the Asesor's model runs in production, and G-22 shows searches the
      guides cannot answer by matching words · **Blocked by:** G-22 · **Blocks:** —
- **What:** in the portal, a question answered only from the guides, ending in a guide and its
  «Llévame ahí». With no model, or no answer in the guides, the deterministic search is what the
  person sees. Never on the phone without a new decision.
- **Acceptance:** the answer always names the guide it came from.

### G-42 Atención al cliente automatizada con IA, WhatsApp incluido [baja]

- [ ] Status · **Trigger:** after the MVP, when the owner opens customer service as a project,
      with G-22's numbers in hand · **Blocked by:** G-22 · **Blocks:** —
- **What:** decided 2026-11-20: not now, kept for after the MVP. An automated first line of
  customer service that answers a message or a voice note with a guide, and hands over to a
  person when it cannot. A WhatsApp number that answers by itself reverses row 13 of Track N
  («no API, no unofficial automation»), so this starts with its own ADR and its own boards.
- **Acceptance:** decided when the trigger fires.

## 6. What this track leaves out

- **Long tutorials filmed by hand.** Costly to make and wrong after the next release. A clip
  here is under a minute, and both its picture and its voice are generated.
- **A tour on first launch.** People close it before they have a reason to read it.
- **A separate help-centre site** as the main way to learn. The public pages (G-30) are a copy of
  what the product already shows.
- **Userflow, Appcues and similar.** Web-first, a monthly cost, and they would draw over El
  Mostrador instead of through Don.
- **A real person's voice.** Cloning one needs that person's written consent and ties the product
  to them.

## 7. Why this shape

- A Stanford study of Mexican retailers found that only 12% kept using digital payments when
  simply handed a device, and that structured onboarding cut the cost per active merchant by up
  to 63%
  ([Stanford GSB](https://www.gsb.stanford.edu/insights/small-retailers-need-more-tech-adopt-digital-payments)).
- An Accion pilot kept over 85% of merchants who were onboarded with personal guidance
  ([Accion](https://www.accion.org/launching-a-new-digital-solution-for-small-businesses-in-uzbekistan)).
- The figures that say interactive guidance beats video come from vendors that sell it. They
  point the same way and are not quoted here.
- Qwen3-TTS: voice design from a description, a reusable voice for many lines, Spanish among its
  ten languages, Apache 2.0 ([QwenLM/Qwen3-TTS](https://github.com/QwenLM/Qwen3-TTS)).

For the first customers a person on WhatsApp teaches more than any format, and tells us which
guides to write. This track is what scales after that.
