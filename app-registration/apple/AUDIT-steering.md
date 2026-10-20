# Steering audit — Apple Guideline 3.1.1 (no purchase paths in the app)

Audited 2026-10-20 against `apps/mobile/src` + `packages/ui/src` (the phone's
entire user-facing surface: screens, i18n locales `es-mx.ts` and
`es-mx-entrar.ts`, link calls). The rule: the binary must not point to
**buying Xangarro** — no purchase CTAs, no pricing, no plan names, no links
to checkout. The app's own function (charging end customers for goods,
WhatsApp/SMS receipts) is unaffected: physical-goods commerce is explicitly
outside 3.1.1.

## Verdict: clean — no violations found

| Area checked                                 | Result |
| -------------------------------------------- | ------ |
| Purchase CTAs / upsell / «contrata», «compra», «suscríbete», pricing | none — every grep hit is domain vocabulary (buying inventory, sale price of the user's products) |
| Plan names / plan rows                        | none by design: `settings-account-section.tsx` carries the note «No plan row: the app never names plans, prices or the portal» |
| `planLimit` / `planBanner` (the limit + payment banners — highest risk) | compliant: they state the fact («Llegaste a N registros este mes», «Tu pago está pendiente — tienes hasta el {fecha}») and direct to the OWNER ROLE («Pide al dueño del negocio que revise su cuenta») with no upgrade path, no URL, no pricing |
| Outbound links (`Linking.openURL`)           | only WhatsApp and SMS — `recordar-saldo`, `recordar-acciones`, `comprobante-acciones` (sending receipts and payment reminders: core physical-goods function) |
| URLs in user-facing copy                     | none. The only `xangarro.mx` reference is a code comment in `packages/ui/src/activation/activation-config.ts` (never rendered) |
| Portal mentions                               | functional administration only («Este producto se edita… desde la cuenta del negocio», «El dueño lo genera en su portal, en Equipo y nómina», «Se cambia desde el portal del dueño») — account-management pointers, which 3.1.1 permits |
| Desvincular dialog                            | neutral wording, no portal URL |
| Activation screen                              | describes the QR/code flow and the portal by role; no commercial copy |

## Standing rules (so the next screen doesn't regress this)

1. Never add a pricing, plan, or «conoce más en xangarro.mx» row anywhere in
   the app — Settings most of all (it's where a «plan» section would feel
   natural).
2. Entitlement states (limits, grace, fallback) always follow the audited
   pattern: state the fact, point at the owner role, never at a purchase.
3. New outbound links: WhatsApp/SMS for the customer-facing function only;
   anything else gets re-audited here.
4. The listing copy obeys the same discipline — describe what the terminal
   does; the subscription lives on the portal, full stop.
