'use client';

import { useEffect } from 'react';

export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    let reloading = false;
    const hadController = !!navigator.serviceWorker.controller;

    const forceUpdate = async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        await reg.update();
      } catch {
        // offline — try again next launch
      }
    };

    const onUpdateFound = (reg: ServiceWorkerRegistration) => {
      const worker = reg.installing || reg.waiting;
      if (!worker || !navigator.serviceWorker.controller) return;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          worker.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    };

    const onControllerChange = () => {
      if (reloading || !hadController) return;
      reloading = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        reg.addEventListener('updatefound', () => onUpdateFound(reg));
        forceUpdate();
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') forceUpdate();
        });
      })
      .catch((err) => {
        console.error('SW registration failed:', err);
      });

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  return <>{children}</>;
}