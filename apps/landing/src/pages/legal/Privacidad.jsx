/** `/privacidad` — the aviso de privacidad integral (N-34). */
import aviso from '../../../../../docs/legal/aviso/aviso-integral.md?raw';

import { LegalPage } from './LegalPage.jsx';

export default function Privacidad() {
  return <LegalPage source={aviso} />;
}
