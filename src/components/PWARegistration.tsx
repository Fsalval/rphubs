'use client';

import { useEffect } from 'react';

export default function PWARegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registrado con éxito:', registration);
        })
        .catch((error) => {
          console.log('Error al registrar SW:', error);
        });
    }
  }, []);

  return null;
}
