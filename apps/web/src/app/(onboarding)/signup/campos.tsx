'use client';

import { Input } from '@/components';

import { CampoContrasena } from '../../_publico/contrasena';
import { dos } from '../../_publico/publico.css';
import { Fuerza } from './fuerza';
import type { Signup } from './use-signup';

function Quien({ s }: { readonly s: Signup }) {
  return (
    <div className={dos}>
      <Input
        labelText="Tu nombre (opcional)"
        autoComplete="name"
        hintText="Así te saludamos en tu portal."
        value={s.fields.tuNombre}
        onChange={(e) => s.set({ tuNombre: e.target.value })}
        data-testid="signup-tu-nombre"
      />
      <Input
        labelText="Nombre de tu negocio"
        autoComplete="organization"
        placeholder="Taquería Don Pedro"
        value={s.fields.nombre}
        onChange={(e) => s.set({ nombre: e.target.value })}
        data-testid="signup-nombre"
      />
    </div>
  );
}

/** Tu nombre and the business side by side, then the email and the password. */
export function Campos({ s }: { readonly s: Signup }) {
  return (
    <div>
      <Quien s={s} />
      <Input
        labelText="Correo"
        type="email"
        autoComplete="email"
        placeholder="tucorreo@ejemplo.mx"
        value={s.fields.email}
        onChange={(e) => s.set({ email: e.target.value })}
        data-testid="signup-email"
      />
      <CampoContrasena
        etiqueta="Contraseña"
        autoComplete="new-password"
        value={s.fields.password}
        onChange={(password) => s.set({ password })}
        testId="signup-password"
        pista={<Fuerza password={s.fields.password} />}
      />
    </div>
  );
}
