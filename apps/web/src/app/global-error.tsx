'use client';

/**
 * Root error boundary. Copy must reassure that nothing was lost — offline
 * capture is a core promise of the product, and a portal error never means a
 * sale went missing (ADR-058, design plan §5.6).
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="es-MX">
      <body>
        <main>
          <h1>Algo salió mal</h1>
          <p>Tus registros están a salvo. Vuelve a intentarlo.</p>
          <button type="button" onClick={() => reset()}>
            Reintentar
          </button>
        </main>
      </body>
    </html>
  );
}
