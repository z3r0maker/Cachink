'use client';

import { useState, type DragEvent } from 'react';

/** Drop handlers for an XML zone (E-11): it lights up while files hover over it. */
export function useArrastre(enviar: (files: FileList) => void) {
  const [arrastrando, setArrastrando] = useState(false);
  return {
    'data-arrastrando': arrastrando,
    onDragOver: (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      setArrastrando(true);
    },
    onDragLeave: () => setArrastrando(false),
    onDrop: (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      setArrastrando(false);
      enviar(e.dataTransfer.files);
    },
  };
}
