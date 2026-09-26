import { Confianza } from './Confianza.jsx';
import CtaFooter from './CtaFooter.jsx';
import { DonCuentasSection } from './DonCuentasSection.jsx';
import Faq from './Faq.jsx';
import { LoNuevo } from './LoNuevo.jsx';
import { ParaQuien } from './ParaQuien.jsx';
import { PortalFeatures } from './PortalFeatures.jsx';
import Precios from './Precios.jsx';
import { Puertas } from './Puertas.jsx';
import { Reel } from './Reel.jsx';

/** Everything under the ticker, in page order. Lazy on the client, eager in prerender. */
export default function BelowFold() {
  return (
    <>
      <Puertas />
      <Reel />
      <PortalFeatures />
      <DonCuentasSection />
      <LoNuevo />
      <Confianza />
      <ParaQuien />
      <Precios />
      <Faq />
      <CtaFooter />
    </>
  );
}
