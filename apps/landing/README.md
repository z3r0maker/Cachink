# Cachink Landing

Marketing landing page for **Cachink** — la app mexicana para llevar la caja de tu negocio. Hecho para emprendedores: panaderías, cafés, tiendas de barrio, talleres, consultorios.

## Run it

It's a static site. Open `index.html` in any browser, or serve the folder with any static file server:

```bash
# Python
python3 -m http.server 8000

# Node
npx serve .
```

Then visit `http://localhost:8000`.

## Structure

- `index.html` — entry point. Loads the CSS, the React + Babel-standalone runtime, and the JSX components.
- `colors_and_type.css` — design tokens (yellow trio, hard borders/shadows, Plus Jakarta Sans, full type scale).
- `landing/` — the React components that compose the page:
  - `Motion.jsx` — `Reveal`, `Parallax`, `TiltCard`, `Wiggle`, `SpinCoin` motion utilities
  - `PhoneScreens.jsx` — static Operativo / Director / NuevaVenta phone mockups
  - `AnimatedHero.jsx` — looping hero phone (capture → ¡CACHINK! burst → row slide-in → total count-up)
  - `Sections.jsx` — Nav, Hero, ParaQuienEs, ComoFunciona, Recorrido, Precios, Contacto, Footer
- `assets/logo.png` — brand logo.

## Design defaults

The page renders with the defaults the design conversation landed on:

- `tone: educational`
- `yellowIntensity: medium`
- Cómo funciona / Contacto sections light (yellow), not dark
- Pricing section visible
- Motion enabled

To change them, edit the `TWEAK_DEFAULTS` object near the bottom of `index.html`.

## Placeholders to replace before launch

- `hola@cachink.mx` (in `landing/Sections.jsx`)
- `+52 55 5555 5555` (in `landing/Sections.jsx`)
- Social media URLs (`landing/Sections.jsx` `SOCIALS` array)

## Going to production

The current setup uses [Babel-standalone](https://babeljs.io/docs/babel-standalone) to compile JSX in the browser at runtime. That's fine for prototyping or low-traffic launches, but for a real production deploy you'll want to bundle and pre-compile (Vite, esbuild, or similar) so visitors don't pay the Babel-standalone download/compile cost on every load.
