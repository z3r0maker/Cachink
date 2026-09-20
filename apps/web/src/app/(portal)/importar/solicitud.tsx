'use client';

import { useState, useTransition } from 'react';

import { Button } from '@/components';
import { solicitarHazloPorMi } from '@/server/actions/hazlo-por-mi';

/** The request form half of «Hazlo por mí» (N-18), split for the size ceiling. */
export function Solicitud({
  onBanner,
}: {
  readonly onBanner: (tone: 'success' | 'critical', text: string) => void;
}) {
  const [sistema, setSistema] = useState('');
  const [notas, setNotas] = useState('');
  const [pending, start] = useTransition();

  const enviar = (files: FileList | null) =>
    start(async () => {
      const form = new FormData();
      form.append('sistema_actual', sistema);
      form.append('notas', notas);
      for (const f of files ?? []) form.append('archivos', f);
      const r = await solicitarHazloPorMi(form);
      if (r.ok) onBanner('success', 'Solicitud enviada. Te avisamos por correo.');
      else onBanner('critical', r.message);
    });

  return (
    <>
      <p style={{ color: 'var(--gray-600)', margin: '0 0 12px' }}>
        Nos entregas tus archivos, el equipo los prepara y tú apruebas antes de que se escriba nada.
      </p>
      <div style={{ display: 'grid', gap: 12 }}>
        <CampoSistema sistema={sistema} setSistema={setSistema} />
        <CampoNotas notas={notas} setNotas={setNotas} />
        <SelectorArchivos onElegir={enviar} />
        <div>
          <Button
            variant="primary"
            disabled={pending || sistema.trim() === ''}
            onClick={() => enviar(null)}
          >
            {pending ? 'Enviando…' : 'Enviar solicitud'}
          </Button>
        </div>
      </div>
    </>
  );
}

function CampoSistema({
  sistema,
  setSistema,
}: {
  readonly sistema: string;
  readonly setSistema: (v: string) => void;
}) {
  return (
    <label style={{ display: 'grid', gap: 4, fontWeight: 600 }}>
      ¿Qué usas hoy?
      <input
        aria-label="Sistema actual"
        value={sistema}
        onChange={(e) => setSistema(e.target.value)}
        placeholder="Excel, una libreta, otro sistema"
        maxLength={120}
        style={{ border: '2px solid var(--black)', borderRadius: 10, padding: '8px 12px' }}
      />
    </label>
  );
}

function CampoNotas({
  notas,
  setNotas,
}: {
  readonly notas: string;
  readonly setNotas: (v: string) => void;
}) {
  return (
    <label style={{ display: 'grid', gap: 4, fontWeight: 600 }}>
      ¿Qué datos quieres migrar?
      <textarea
        aria-label="Qué datos migrar"
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
        placeholder="Productos, clientes… lo que tengas."
        rows={3}
        maxLength={2000}
        style={{
          border: '2px solid var(--black)',
          borderRadius: 10,
          padding: '8px 12px',
          fontFamily: 'inherit',
          fontSize: 14,
        }}
      />
    </label>
  );
}

function SelectorArchivos({ onElegir }: { readonly onElegir: (files: FileList | null) => void }) {
  return (
    <label
      style={{
        display: 'inline-flex',
        gap: 8,
        alignItems: 'center',
        border: '2px solid var(--black)',
        borderRadius: 10,
        padding: '8px 14px',
        fontWeight: 700,
        cursor: 'pointer',
        justifySelf: 'start',
      }}
    >
      Elegir archivos (.xlsx/.csv, hasta 5, 20 MB c/u)
      <input
        type="file"
        multiple
        accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        style={{ display: 'none' }}
        data-testid="hazlo-por-mi-archivo"
        onChange={(e) => onElegir(e.target.files)}
      />
    </label>
  );
}
