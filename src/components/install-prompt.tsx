'use client';

import { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let deferredPrompt: any = null;

export function InstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Android browsers only; the install prompt is not provided on desktop
    // or iOS Safari, and standalone means the app is already installed.
    const isAndroid = /Android/i.test(navigator.userAgent);
    if (!isAndroid) return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    let installTimer: ReturnType<typeof setTimeout>;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      deferredPrompt = event;
      installTimer = setTimeout(() => setShow(true), 30000);
    };

    const onAppInstalled = () => {
      setShow(false);
      deferredPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
      clearTimeout(installTimer);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;
    setShow(false);
    // Cancel the auto prompt if the user dismissed the install dialog
    void choice;
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 z-50 sm:inset-x-auto sm:right-4 sm:w-80">
      <div className="rounded-2xl bg-white border border-border shadow-xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-orange-50 flex items-center justify-center">
          <img src="/cyberville/logo-mark.png" alt="Cyberville" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight">Install Cyberville Pharmacy POS</p>
          <p className="text-xs text-muted-foreground">Get instant access from your home screen</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleInstall}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90"
          >
            <Download className="w-3.5 h-3.5" /> Install
          </button>
          <button
            onClick={() => setShow(false)}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted"
            aria-label="Not now"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}