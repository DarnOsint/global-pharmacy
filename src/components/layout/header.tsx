'use client';

import { useAppStore } from '@/lib/store';
import { Menu, Wifi, WifiOff, CloudOff } from 'lucide-react';
import { useEffect, useState } from 'react';

export function Header() {
  const { toggleSidebar, isOnline, setIsOnline, pendingSync } = useAppStore();
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const update = () => {
      setCurrentTime(
        new Date().toLocaleString('en-NG', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [setIsOnline]);

  return (
    <header className="h-16 border-b border-border bg-card flex items-center px-4 gap-4 sticky top-0 z-30">
      <button
        onClick={toggleSidebar}
        className="lg:hidden p-2 rounded-lg hover:bg-muted"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1" />

      <span className="text-xs text-muted-foreground hidden sm:block">
        {currentTime}
      </span>

      {pendingSync > 0 && (
        <div className="flex items-center gap-1 text-xs text-accent bg-accent-50 px-2 py-1 rounded-full">
          <CloudOff className="w-3 h-3" />
          {pendingSync} pending
        </div>
      )}

      <div className="flex items-center gap-1.5">
        {isOnline ? (
          <Wifi className="w-4 h-4 text-success" />
        ) : (
          <WifiOff className="w-4 h-4 text-danger" />
        )}
        <span className="text-xs hidden sm:block">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
    </header>
  );
}
