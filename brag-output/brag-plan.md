# Brag Plan: Xangarro!

## What is this app?
A mobile-first micro-POS and finance app for Mexican emprendedores: tap products to sell, cobrar in Efectivo/Transferencia/Tarjeta/QR-CoDi/Crédito, close the cash drawer at night, and get NIF statements — offline-first, syncs to the cloud when there's signal.

## The angle
"A taquería counter, not an accounting class." The whole brand is a loud yellow coin with hard black shadows — it looks like a sticker on a register. The video treats a normal Tuesday at Taquería Don Pedro (the app's own seed business) as the launch event: three taps, one cobro, the right change, and a corte that cuadra to the peso. The brag is that none of it needed internet or a contador.

## Hook (first 2-3 seconds)
Full-bleed Amarillo Vibrante. A black, neobrutalist question slams in: **"¿Cuánto vendiste hoy?"** — then a smaller, drier line under it: **"Sin Excel. Sin internet."** The coin icon drops in on the corner with a hard shadow.

## Key moments (the middle)
- Tap-to-cart: a finger taps **Taco al pastor ×3**, **Quesadilla**, **Agua de horchata** tiles; the sticky footer counts up to **"Cobrar $145.00"**.
- Checkout: the five método cards stack (Efectivo selected), **Efectivo recibido $200.00** types in, the green **Cambio $55.00** card lands, then **"Cobro confirmado"** stamps.
- Corte de día: **Efectivo esperado $4,850.00 / Efectivo contado $4,850.00 / Diferencia $0.00** — and the top pill flips **"Sin conexión" → "Sincronizado"**.

## Outro / punchline
Coin icon + **Xangarro!** wordmark + **"Finanzas para emprendedores."** Tiny tag: **"Hecho en México 🇲🇽"**.

## User flow worth showing
Entry: Ventas screen with product tiles → Key action: tap products, Cobrar, Efectivo with change → Result: Cobro confirmado, and at night the corte cuadra with the sync pill going green.

## Tone
- Preset: default
- Creative direction: sticker-loud taquería-counter launch — neobrutalist, warm, a little cheeky
- Interpretation: brisk but readable; hard, stamp-like entrances (the app's own press-down "stamp" feel), hard offset shadows instead of glows, clean wipes in yellow/black.

## Format: landscape — 1920x1080
## Duration: 21s

## Visual identity (from the project — packages/ui/src/theme.ts)
- Background: #FFD60A (yellow) for hero scenes; #F7F7F5 (offwhite) app surface
- Accent: #0D0D0D black borders 2-2.5px + hard shadows `4px 4px 0 #0D0D0D` / `5px 5px 0`
- Text: #0D0D0D / #1A1A18; muted #6F6F6B
- Semantic: green #00C896 / greenSoft #D6FFF4 / greenText #007E5E; yellowSoft #FFFBCC; blueText #1D59FF
- Display font: Plus Jakarta Sans 800/900, tight tracking (-0.03em)
- Body font: Plus Jakarta Sans 500/600
- Strongest visual element: the yellow coin icon (assets/brand/icon-padded.png) and the black-bordered, hard-shadow cards

## Share copy (draft)
Xangarro! es un punto de venta para la taquería de la esquina: tres toques, cobras, te da el cambio y el corte cuadra — con o sin internet.

## Audio direction
- Role: warm bed + light UI layer
- Music: happy-beats-business-moves-vol-1 (upbeat, 120 BPM)
- Music treatment: start at 0, ~0.32 volume, fade out over the last ~1.5s under the logo
- Music cue guidance: preset read (assets/music/cues/…vol-1…music-cues.json). Beat every ~0.5s from 3.02s. Strong cues: 16.02, 17.02, 18.52, 20.02s. Lock "Cobro confirmado" near 14.52s (beat), the "Diferencia $0.00" payoff near 17.52s and the logo landing near 19.02s (beat, with 20.02 strong cue for the tag). Tile taps on every other beat (~1.0s apart) so labels stay readable.
- Audio-reactive treatment: subtle; bass nudges the hard-shadow offset / background coin presence on yellow scenes. No bars or waveforms.
- SFX posture: moderate, motion-matched
- Audio-coupled moments: tile taps (clicks), cart footer count-up, efectivo typing (keypress), Cambio card landing (soft impact), Cobro confirmado + corte $0.00 (bell), logo (soft impact)
- Restraint rule: no stacked hits; nothing brighter than a click on repeated actions.

## Storyboard

### Scene 1 — Hook — 3.0s
Yellow full-bleed. "¿Cuánto vendiste hoy?" stamps in huge (holds ≥1.6s). "Sin Excel. Sin internet." slides under at ~1.1s. Coin icon drops into a corner with hard shadow.
Sequential/interaction: yes — headline then subline
Audio intent: grab attention, friendly
Audio-coupled idea: soft impact on headline stamp
Transition mood: hard wipe (black bar) → Scene 2

### Scene 2 — Reveal — 2.5s
Offwhite. Coin icon + "Xangarro!" wordmark stamp in; "Finanzas para emprendedores." fades up. Small chip: "Taquería Don Pedro · Turno abierto".
Sequential/interaction: logo, then tagline, then chip
Audio intent: announce
Audio-coupled idea: bong on logo
Transition mood: clean slide → Scene 3

### Scene 3 — Vende en tres toques — 5.0s
Left: caption "Vende en tres toques." Right: phone frame with Ventas screen — header "Ventas", "Toca un producto para agregarlo a la venta", product tiles grid (Taco al pastor $25, Quesadilla $40, Agua de horchata $30, Gringa $55). A tap dot presses tiles (press-down shadow shrink), qty badges appear, footer bar in yellowSoft counts "5 productos · $145.00" and button "Cobrar $145.00".
Sequential/interaction: yes — 3 taps ~0.9-1.0s apart; footer total updates each tap
Audio intent: tactile, rhythmic
Audio-coupled idea: click per tap, beat-grid
Transition mood: push left → Scene 4

### Scene 4 — Cobra y da el cambio — 5.0s
Phone shows checkout: "Total a cobrar $145.00"; método cards (Efectivo selected with black border + yellow, Transferencia, Tarjeta, QR/CoDi, Crédito). "Efectivo recibido" field types "$200.00". Green Cambio card lands "Cambio $55.00". Then a stamp "Cobro confirmado". Caption left: "Cobra. Te da el cambio."
Sequential/interaction: yes — select Efectivo, type amount, cambio card, confirm stamp
Audio intent: satisfying payoff
Audio-coupled idea: click on select, keypress per digit, soft impact on cambio, bell on confirmado
Transition mood: wipe → Scene 5

### Scene 5 — El corte cuadra — 3.5s
Offwhite. Big "Corte de día" card, three rows: Efectivo esperado $4,850.00 · Efectivo contado $4,850.00 · Diferencia $0.00 (green, lands on strong cue ~17.52s). Top-right pill flips "Sin conexión" → "Sincronizado". Caption: "Y en la noche, el corte cuadra."
Sequential/interaction: rows one by one (every other beat), then pill flip
Audio intent: relief / confidence
Audio-coupled idea: bell on $0.00, switch on pill
Transition mood: yellow wipe → Scene 6

### Scene 6 — Outro — 2.0s (+ tail)
Yellow. Coin icon, "Xangarro!" huge, "Finanzas para emprendedores.", small "Hecho en México 🇲🇽". Lands ~19.0s, holds to 21s, gentle fade at end.
Sequential/interaction: logo, tagline, tag
Audio intent: warm close
Audio-coupled idea: soft impact on logo; music fades
Transition mood: final fade

Durations: 3.0 + 2.5 + 5.0 + 5.0 + 3.5 + 2.0 = 21.0s

**Music mood for this video:** upbeat
**Audio summary:** Friendly upbeat bed from the first frame, a crisp layer of taps and keypresses through the sale, bells on "Cobro confirmado" and "Diferencia $0.00", fading out under the logo.
