# Cachink store screenshots

Produced by `pnpm store:screenshots` from the Tauri dev build and the Expo
web bundle using Playwright. Six flows × four device sizes = 24 images.

## Flows

1. **Operativo — Nueva venta modal**
2. **Operativo — Ventas list with today's total**
3. **Operativo — Corte de día modal**
4. **Director — Director Home (hero + KPI strip)**
5. **Director — Estado de Resultados**
6. **Director — Indicadores**

## Device sizes

| Platform       | Width × Height | Why                                 |
| -------------- | -------------- | ----------------------------------- |
| iPhone 6.7"    | 1290 × 2796    | Required for App Store (6.7" set)   |
| iPhone 5.5"    | 1242 × 2208    | Required for App Store (5.5" set)   |
| iPad Pro 12.9" | 2048 × 2732    | Required for App Store iPad Pro set |
| Android 7"     | 1600 × 2560    | Play Store tablet set               |

## Regenerating

```sh
# Ensure the dev servers are running:
pnpm --filter @cachink/desktop dev           # desktop Tauri
pnpm --filter @cachink/mobile web            # Expo web bundle

# In a third shell:
pnpm store:screenshots
```

Outputs land as `docs/store/screenshots/<flow>-<device>.png`. Git-LFS-ready
but currently committed plain.
