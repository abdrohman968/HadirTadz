'use client';

import { useEffect } from 'react';

/** Mendaftarkan service worker untuk PWA (DEVELOPMENT_RULES #15). */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => console.debug('[HadirTadz] SW registered:', reg.scope))
      .catch((err) => console.error('[HadirTadz] SW registration failed:', err));
  }, []);
  return null;
}